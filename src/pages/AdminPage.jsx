
    import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Switch } from '@/components/ui/switch';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { Trash2, Edit, RotateCcw } from 'lucide-react';
    import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

    const AdminSettingsTab = () => {
        const { appSettings: globalAppSettings } = useSupabaseAuth();
        const [localSettings, setLocalSettings] = useState(null);
        const { toast } = useToast();

        useEffect(() => {
            if (globalAppSettings) {
                setLocalSettings(JSON.parse(JSON.stringify(globalAppSettings)));
            }
        }, [globalAppSettings]);

        const handleSettingToggle = async (settingName) => {
            if (!localSettings || !localSettings[settingName]) return;

            const currentSetting = localSettings[settingName];
            const newEnabledState = !currentSetting.is_enabled;

            setLocalSettings(prev => ({
                ...prev,
                [settingName]: { ...prev[settingName], is_enabled: newEnabledState }
            }));

            const { error } = await supabase
                .from('app_settings')
                .update({ is_enabled: newEnabledState })
                .eq('id', currentSetting.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Error updating setting', description: error.message });
                setLocalSettings(globalAppSettings);
            } else {
                toast({ title: 'Success', description: 'Setting updated successfully.' });
            }
        };
        
        if (!localSettings) {
            return (
                <Card className="glass-card text-white">
                    <CardHeader>
                        <CardTitle>App Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Loading settings...</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription className="text-white/70">Configure special rules and features. Changes are saved in real-time.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
                  <div>
                    <Label htmlFor="always-show-predictions" className="text-lg font-medium">Always Show Predictions</Label>
                    <p className="text-sm text-white/70">If enabled, users can see others' predictions for all games, even before they start. (Used for finals)</p>
                  </div>
                  <Switch
                    id="always-show-predictions"
                    checked={localSettings.always_show_predictions?.is_enabled || false}
                    onCheckedChange={() => handleSettingToggle('always_show_predictions')}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
                  <div>
                    <Label htmlFor="special-lock-time" className="text-lg font-medium">Special Lock Times</Label>
                    <p className="text-sm text-white/70">If enabled, top 3 players have different prediction lock times (1st: 1h, 2nd: 45m, 3rd: 30m before game).</p>
                  </div>
                  <Switch
                    id="special-lock-time"
                    checked={localSettings.special_lock_times?.is_enabled || false}
                    onCheckedChange={() => handleSettingToggle('special_lock_times')}
                  />
                </div>
              </CardContent>
            </Card>
        );
    };


    const AdminPage = () => {
      const { toast } = useToast();
      const [users, setUsers] = useState([]);
      const [games, setGames] = useState([]);
      const [loadingUsers, setLoadingUsers] = useState(true);
      const [loadingGames, setLoadingGames] = useState(true);

      const [newGame, setNewGame] = useState({ team_a: '', team_b: '', game_time: '' });
      const [editingGame, setEditingGame] = useState(null);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

      const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) {
          toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
        } else {
          setUsers(data);
        }
        setLoadingUsers(false);
      }, [toast]);

      const fetchGames = useCallback(async () => {
        setLoadingGames(true);
        const { data, error } = await supabase.from('games').select('*').order('game_time', { ascending: false });
        if (error) {
          toast({ variant: 'destructive', title: 'Error fetching games', description: error.message });
        } else {
          setGames(data);
        }
        setLoadingGames(false);
      }, [toast]);

      useEffect(() => {
        fetchUsers();
        fetchGames();
      }, [fetchUsers, fetchGames]);

      const handleApproveUser = async (userId, currentStatus) => {
        const { error } = await supabase.from('profiles').update({ approved: !currentStatus }).eq('id', userId);
        if (error) {
          toast({ variant: 'destructive', title: 'Error updating user', description: error.message });
        } else {
          toast({ title: 'Success', description: `User has been ${!currentStatus ? 'approved' : 'unapproved'}.` });
          fetchUsers();
        }
      };
      
      const handleResetAllPoints = async () => {
        const { error } = await supabase.from('profiles').update({ 
            points: 0,
            precise_draw_bonus: 0,
            precise_score_bonus: 0,
            goal_difference_bonus: 0,
            correct_winner_bonus: 0
        }).neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            toast({ variant: 'destructive', title: 'Error resetting points', description: error.message });
        } else {
            toast({ title: 'Success', description: 'All user points and tiebreakers have been reset to 0.' });
            fetchUsers();
        }
      };


      const handleRoleChange = async (userId, role) => {
        const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
        if (error) {
          toast({ variant: 'destructive', title: 'Error updating role', description: error.message });
        } else {
          toast({ title: 'Success', description: 'User role updated.' });
          fetchUsers();
        }
      };

      const handleResetPoints = async (userId) => {
        const { error } = await supabase.from('profiles').update({ 
            points: 0,
            precise_draw_bonus: 0,
            precise_score_bonus: 0,
            goal_difference_bonus: 0,
            correct_winner_bonus: 0
        }).eq('id', userId);
        if (error) {
          toast({ variant: 'destructive', title: 'Error resetting points', description: error.message });
        } else {
          toast({ title: 'Success', description: 'User points and tiebreakers have been reset to 0.' });
          fetchUsers();
        }
      };

      const handleDeleteUser = async (userId) => {
        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { user_id: userId },
        });

        if (error || data?.error) {
          toast({ variant: 'destructive', title: 'Error deleting user', description: error?.message || data?.error });
        } else {
          toast({ title: 'Success', description: 'User has been deleted.' });
          fetchUsers();
        }
      };

      const handleNewGameChange = (e) => {
        setNewGame({ ...newGame, [e.target.name]: e.target.value });
      };

      const handleAddGame = async (e) => {
        e.preventDefault();
        if (!newGame.team_a || !newGame.team_b || !newGame.game_time) {
          toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out all game details.' });
          return;
        }
        const { error } = await supabase.from('games').insert([{ ...newGame, status: 'scheduled' }]);
        if (error) {
          toast({ variant: 'destructive', title: 'Error adding game', description: error.message });
        } else {
          toast({ title: 'Success', description: 'New game added.' });
          setNewGame({ team_a: '', team_b: '', game_time: '' });
          fetchGames();
        }
      };

      const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          const csv = event.target.result;
          const lines = csv.split('\n').slice(1);
          const gamesToAdd = lines.map(line => {
            const [team_a, team_b, game_time] = line.split(',');
            if (team_a && team_b && game_time) {
              return { team_a: team_a.trim(), team_b: team_b.trim(), game_time: game_time.trim(), status: 'scheduled' };
            }
            return null;
          }).filter(Boolean);

          if (gamesToAdd.length > 0) {
            const { error } = await supabase.from('games').insert(gamesToAdd);
            if (error) {
              toast({ variant: 'destructive', title: 'Error uploading games', description: error.message });
            } else {
              toast({ title: 'Success', description: `${gamesToAdd.length} games added from CSV.` });
              fetchGames();
            }
          }
        };
        reader.readAsText(file);
      };

      const handleResultChange = async (gameId, team, value) => {
        const updatedGames = games.map(g => g.id === gameId ? { ...g, [team]: value } : g);
        setGames(updatedGames);
      };

      const handleSaveResult = async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (game.result_a === null || game.result_b === null || game.result_a === '' || game.result_b === '') {
          toast({ variant: 'destructive', title: 'Missing score', description: 'Please enter scores for both teams.' });
          return;
        }
        const { error } = await supabase.from('games').update({ result_a: game.result_a, result_b: game.result_b, status: 'finished' }).eq('id', gameId);
        if (error) {
          toast({ variant: 'destructive', title: 'Error saving result', description: error.message });
        } else {
          toast({ title: 'Success', description: 'Game result saved. Triggering point calculation...' });
          const { error: functionError } = await supabase.functions.invoke('calculate-points', {
            body: { game_id: gameId },
          });
          if (functionError) {
            toast({ variant: 'destructive', title: 'Error calculating points', description: functionError.message });
          } else {
            toast({ title: 'Success', description: 'Points calculation complete.' });
          }
          fetchGames();
          fetchUsers();
        }
      };

      const openEditDialog = (game) => {
        const localDateTime = new Date(new Date(game.game_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setEditingGame({ ...game, game_time: localDateTime });
        setIsEditDialogOpen(true);
      };

      const handleUpdateGame = async (e) => {
        e.preventDefault();
        if (!editingGame) return;
        const { id, team_a, team_b, game_time } = editingGame;
        const { error } = await supabase.from('games').update({ team_a, team_b, game_time: new Date(game_time).toISOString() }).eq('id', id);
        if (error) {
          toast({ variant: 'destructive', title: 'Error updating game', description: error.message });
        } else {
          toast({ title: 'Success', description: 'Game updated.' });
          setIsEditDialogOpen(false);
          setEditingGame(null);
          fetchGames();
        }
      };

      const handleDeleteGame = async (gameId) => {
        const { error } = await supabase.from('games').delete().eq('id', gameId);
        if (error) {
          toast({ variant: 'destructive', title: 'Error deleting game', description: error.message });
        } else {
          toast({ title: 'Success', description: 'Game deleted.' });
          fetchGames();
        }
      };

      return (
        <>
          <Helmet>
            <title>Admin Panel - Prediction Game</title>
            <meta name="description" content="Manage users, games, and settings." />
          </Helmet>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">Admin Panel</h1>
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 text-white">
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="games">Game Management</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="users">
                <Card className="glass-card text-white">
                  <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Users</CardTitle>
                            <CardDescription className="text-white/70">Approve, manage roles, and view user details.</CardDescription>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Reset All Points</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Reset All User Points?</AlertDialogTitle>
                                <AlertDialogDescription>This will reset all user points and tiebreakers to 0. This action is irreversible.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetAllPoints}>Confirm Reset</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                  </CardHeader>
                  <CardContent>
                    {loadingUsers ? <p>Loading users...</p> : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20 hover:bg-white/10">
                            <TableHead className="text-white/80">Username</TableHead>
                            <TableHead className="text-white/80">Points</TableHead>
                            <TableHead className="text-white/80">Approved</TableHead>
                            <TableHead className="text-white/80">Role</TableHead>
                            <TableHead className="text-white/80 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map(user => (
                            <TableRow key={user.id} className="border-white/20">
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.points}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`approved-${user.id}`}
                                    checked={user.approved}
                                    onCheckedChange={() => handleApproveUser(user.id, user.approved)}
                                  />
                                  <Label htmlFor={`approved-${user.id}`}>{user.approved ? 'Yes' : 'No'}</Label>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select onValueChange={(value) => handleRoleChange(user.id, value)} defaultValue={user.role}>
                                  <SelectTrigger className="w-[120px] bg-white/20 border-white/30">
                                    <SelectValue placeholder="Set role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-yellow-400 hover:text-yellow-500"><RotateCcw className="h-4 w-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reset Points?</AlertDialogTitle>
                                      <AlertDialogDescription>This will reset {user.username}'s points and tiebreakers to 0. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleResetPoints(user.id)}>Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                      <AlertDialogDescription>This will permanently delete {user.username} and all their data. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Confirm Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="games">
                <div className="space-y-6">
                  <Card className="glass-card text-white">
                    <CardHeader>
                      <CardTitle>Add New Game</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={handleAddGame} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <Label htmlFor="team_a">Team A</Label>
                          <Input id="team_a" name="team_a" value={newGame.team_a} onChange={handleNewGameChange} placeholder="e.g., Team Dragon" className="bg-white/20 border-white/30" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="team_b">Team B</Label>
                          <Input id="team_b" name="team_b" value={newGame.team_b} onChange={handleNewGameChange} placeholder="e.g., Team Griffin" className="bg-white/20 border-white/30" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="game_time">Game Time</Label>
                          <Input id="game_time" name="game_time" type="datetime-local" value={newGame.game_time} onChange={handleNewGameChange} className="bg-white/20 border-white/30" />
                        </div>
                        <Button type="submit">Add Game</Button>
                      </form>
                      <div className="border-t border-white/20 pt-4">
                        <Label htmlFor="csv-upload">Or Upload CSV</Label>
                        <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="bg-white/20 border-white/30" />
                        <a href="/demo.csv" download className="text-sm text-cyan-300 hover:underline mt-2 inline-block">Download CSV Template</a>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card text-white">
                    <CardHeader>
                      <CardTitle>Manage Existing Games</CardTitle>
                      <CardDescription className="text-white/70">Set final scores for completed games.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingGames ? <p>Loading games...</p> : (
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20 hover:bg-white/10">
                              <TableHead className="text-white/80">Match</TableHead>
                              <TableHead className="text-white/80">Game Time</TableHead>
                              <TableHead className="text-white/80">Status</TableHead>
                              <TableHead className="text-white/80">Final Score</TableHead>
                              <TableHead className="text-white/80 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {games.map(game => (
                              <TableRow key={game.id} className="border-white/20">
                                <TableCell>{game.team_a} vs {game.team_b}</TableCell>
                                <TableCell>{new Date(game.game_time).toLocaleString()}</TableCell>
                                <TableCell>{game.status}</TableCell>
                                <TableCell>
                                  {game.status === 'scheduled' || game.status === 'started' ? (
                                    <div className="flex items-center gap-2">
                                      <Input type="number" value={game.result_a ?? ''} onChange={(e) => handleResultChange(game.id, 'result_a', e.target.value)} className="w-16 bg-white/20 border-white/30" />
                                      <span>-</span>
                                      <Input type="number" value={game.result_b ?? ''} onChange={(e) => handleResultChange(game.id, 'result_b', e.target.value)} className="w-16 bg-white/20 border-white/30" />
                                      <Button size="sm" onClick={() => handleSaveResult(game.id)}>Save</Button>
                                    </div>
                                  ) : `${game.result_a} - ${game.result_b}`}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button variant="ghost" size="icon" className="text-cyan-300 hover:text-cyan-400" onClick={() => openEditDialog(game)}><Edit className="h-4 w-4" /></Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Game?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the game and all associated predictions. This action cannot be undone.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteGame(game.id)}>Confirm Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="settings">
                <AdminSettingsTab />
              </TabsContent>
            </Tabs>
          </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="glass-card text-white border-white/20">
              <DialogHeader>
                <DialogTitle>Edit Game</DialogTitle>
              </DialogHeader>
              {editingGame && (
                <form onSubmit={handleUpdateGame} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-team_a">Team A</Label>
                    <Input id="edit-team_a" value={editingGame.team_a} onChange={(e) => setEditingGame({ ...editingGame, team_a: e.target.value })} className="bg-white/20 border-white/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-team_b">Team B</Label>
                    <Input id="edit-team_b" value={editingGame.team_b} onChange={(e) => setEditingGame({ ...editingGame, team_b: e.target.value })} className="bg-white/20 border-white/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-game_time">Game Time</Label>
                    <Input id="edit-game_time" type="datetime-local" value={editingGame.game_time} onChange={(e) => setEditingGame({ ...editingGame, game_time: e.target.value })} className="bg-white/20 border-white/30" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </>
      );
    };

    export default AdminPage;
  