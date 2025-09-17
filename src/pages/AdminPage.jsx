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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, RotateCcw } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

// Pieejamās līgas, ko var norādīt spēlēm
const LEAGUE_OPTIONS = [
  "Pamata turnīrs",
  "Izslēgšanas spēles",
  "Ceturtdaļfināls",
  "Pusfināls",
  "Fināls"
];

/**
 * Admin Settings Tab
 * Atbild par aplikācijas īpašo iestatījumu (features) pārslēgšanu
 */
const AdminSettingsTab = () => {
  const { appSettings: globalAppSettings } = useSupabaseAuth();
  const [localSettings, setLocalSettings] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (globalAppSettings) {
      // Klonējam settings, lai lokāli varētu mainīt
      setLocalSettings(JSON.parse(JSON.stringify(globalAppSettings)));
    }
  }, [globalAppSettings]);

  const handleSettingToggle = async (settingName) => {
    if (!localSettings || !localSettings[settingName]) return;

    const currentSetting = localSettings[settingName];
    const newEnabledState = !currentSetting.is_enabled;

    // Optimistiskais UI update
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
      setLocalSettings(globalAppSettings); // revert atpakaļ
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
        <CardDescription className="text-white/70">
          Configure special rules and features. Changes are saved in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
          <div>
            <Label htmlFor="always-show-predictions" className="text-lg font-medium">
              Always Show Predictions
            </Label>
            <p className="text-sm text-white/70">
              If enabled, users can see others' predictions for all games, even before they start. (Used for finals)
            </p>
          </div>
          <Switch
            id="always-show-predictions"
            checked={localSettings.always_show_predictions?.is_enabled || false}
            onCheckedChange={() => handleSettingToggle('always_show_predictions')}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
          <div>
            <Label htmlFor="special-lock-times" className="text-lg font-medium">
              Special Lock Times
            </Label>
            <p className="text-sm text-white/70">
              If enabled, top 3 players have different prediction lock times (1st: 1h, 2nd: 45m, 3rd: 30m before game).
            </p>
          </div>
          <Switch
            id="special-lock-times"
            checked={localSettings.special_lock_times?.is_enabled || false}
            onCheckedChange={() => handleSettingToggle('special_lock_times')}
          />
        </div>
      </CardContent>
    </Card>
  );
};
// =========================
// AdminPage — SĀKUMS
// =========================
const AdminPage = () => {
  const { toast } = useToast();

  // -------------------------
  // State
  // -------------------------
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);

  // Jaunās spēles forma (ar league)
  const [newGame, setNewGame] = useState({
    team_a: "",
    team_b: "",
    game_time: "",
    league: LEAGUE_OPTIONS[0], // default: "Pamata turnīrs"
  });

  // Rediģējamās spēles dialogs
  const [editingGame, setEditingGame] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // -------------------------
  // Helpers: datu ielāde
  // -------------------------
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: error.message,
      });
    } else {
      setUsers(data || []);
    }
    setLoadingUsers(false);
  }, [toast]);

  const fetchGames = useCallback(async () => {
    setLoadingGames(true);
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("game_time", { ascending: true });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching games",
        description: error.message,
      });
    } else {
      setGames(data || []);
    }
    setLoadingGames(false);
  }, [toast]);

  // Ielādējam datus un pieslēdzam realtime
  useEffect(() => {
    fetchUsers();
    fetchGames();

    // Realtime — profiles
    const profilesChannel = supabase
      .channel("admin-profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchUsers()
      )
      .subscribe();

    // Realtime — games
    const gamesChannel = supabase
      .channel("admin-games-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => fetchGames()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel).catch(() => {});
      supabase.removeChannel(gamesChannel).catch(() => {});
    };
  }, [fetchUsers, fetchGames]);

  // -------------------------
  // User Management — handlers
  // -------------------------
  const handleApproveUser = async (userId, currentStatus) => {
    const { error } = await supabase
      .from("profiles")
      .update({ approved: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating user",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: `User has been ${!currentStatus ? "approved" : "unapproved"}.`,
      });
      fetchUsers();
    }
  };

  const handleRoleChange = async (userId, role) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating role",
        description: error.message,
      });
    } else {
      toast({ title: "Success", description: "User role updated." });
      fetchUsers();
    }
  };

  const handleResetPoints = async (userId) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        points: 0,
        precise_draw_bonus: 0,
        precise_score_bonus: 0,
        goal_difference_bonus: 0,
        correct_winner_bonus: 0,
      })
      .eq("id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error resetting points",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "User points and tiebreakers have been reset to 0.",
      });
      fetchUsers();
    }
  };

  const handleResetAllPoints = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        points: 0,
        precise_draw_bonus: 0,
        precise_score_bonus: 0,
        goal_difference_bonus: 0,
        correct_winner_bonus: 0,
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error resetting points",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "All user points and tiebreakers have been reset to 0.",
      });
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId) => {
    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: userId },
    });

    if (error || data?.error) {
      toast({
        variant: "destructive",
        title: "Error deleting user",
        description: error?.message || data?.error,
      });
    } else {
      toast({ title: "Success", description: "User has been deleted." });
      fetchUsers();
    }
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!newGame.team_a || !newGame.team_b || !newGame.game_time) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill out all game details.',
      });
      return;
    }

    const { error } = await supabase.from('games').insert([{
      ...newGame,
      status: 'scheduled',
    }]);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error adding game',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success',
        description: 'New game added.',
      });
      setNewGame({ team_a: '', team_b: '', game_time: '', league: 'Pamata turnīrs' });
      fetchGames();
    }
  };


  // -------------------------
  // Jaunās spēles formas helperi
  // (Games tab nāks 3. daļā)
  // -------------------------
  const handleNewGameChange = (e) => {
    setNewGame((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // =======================================
  // JSX — Header + Tabs + USER MANAGEMENT
  // =======================================
  return (
    <>
      <Helmet>
        <title>Admin Panel - Prediction Game</title>
        <meta name="description" content="Manage users, games, and settings." />
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Admin Panel
        </h1>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 text-white">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="games">Game Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* =========================
              USERS TAB
          ========================== */}
          <TabsContent value="users">
            <Card className="glass-card text-white">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription className="text-white/70">
                      Approve, manage roles, and view user details.
                    </CardDescription>
                  </div>

                  {/* Reset ALL points */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Reset All Points</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset All User Points?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all user points and tiebreakers to 0.
                          This action is irreversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAllPoints}>
                          Confirm Reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>

              <CardContent>
                {loadingUsers ? (
                  <p>Loading users...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20 hover:bg-white/10">
                        <TableHead className="text-white/80">Username</TableHead>
                        <TableHead className="text-white/80">Points</TableHead>
                        <TableHead className="text-white/80">Approved</TableHead>
                        <TableHead className="text-white/80">Role</TableHead>
                        <TableHead className="text-white/80 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user.id}
                          className="border-white/20 hover:bg-white/5"
                        >
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.points}</TableCell>

                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`approved-${user.id}`}
                                checked={!!user.approved}
                                onCheckedChange={() =>
                                  handleApproveUser(user.id, user.approved)
                                }
                              />
                              <Label htmlFor={`approved-${user.id}`}>
                                {user.approved ? "Yes" : "No"}
                              </Label>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Select
                              onValueChange={(value) =>
                                handleRoleChange(user.id, value)
                              }
                              defaultValue={user.role || "user"}
                            >
                              <SelectTrigger className="w-[140px] bg-white/20 border-white/30">
                                <SelectValue placeholder="Set role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="text-right space-x-2">
                            {/* Reset one user points */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-yellow-400 hover:text-yellow-500"
                                  title="Reset points"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Points?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reset {user.username}
                                    {"'"}s points and all tiebreakers to 0. This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleResetPoints(user.id)}
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            {/* Delete user */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {user.username} and
                                    all their data. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    Confirm Delete
                                  </AlertDialogAction>
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

          {/* Games un Settings tab nāks nākamajā daļā */}
          {/* =========================
              GAMES TAB
          ========================== */}
          <TabsContent value="games">
            <div className="space-y-6">

              {/* Add new game */}
              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle>Add New Game</CardTitle>
                  <CardDescription className="text-white/70">
                    Add matches manually or upload via CSV.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <form
                    onSubmit={handleAddGame}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="team_a">Team A</Label>
                      <Input
                        id="team_a"
                        name="team_a"
                        value={newGame.team_a}
                        onChange={handleNewGameChange}
                        placeholder="e.g., Team Dragon"
                        className="bg-white/20 border-white/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="team_b">Team B</Label>
                      <Input
                        id="team_b"
                        name="team_b"
                        value={newGame.team_b}
                        onChange={handleNewGameChange}
                        placeholder="e.g., Team Griffin"
                        className="bg-white/20 border-white/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="game_time">Game Time</Label>
                      <Input
                        id="game_time"
                        name="game_time"
                        type="datetime-local"
                        value={newGame.game_time}
                        onChange={handleNewGameChange}
                        className="bg-white/20 border-white/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="league">League</Label>
                      <Select
                        value={newGame.league}
                        onValueChange={(value) =>
                          setNewGame((prev) => ({ ...prev, league: value }))
                        }
                      >
                        <SelectTrigger className="bg-white/20 border-white/30">
                          <SelectValue placeholder="Select league" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAGUE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit">Add Game</Button>
                  </form>

                  {/* CSV upload */}
                  <div className="border-t border-white/20 pt-4">
                    <Label htmlFor="csv-upload">Or Upload CSV</Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="bg-white/20 border-white/30"
                    />
                    <a
                      href="/demo.csv"
                      download
                      className="text-sm text-cyan-300 hover:underline mt-2 inline-block"
                    >
                      Download CSV Template
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Manage existing games */}
              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle>Manage Existing Games</CardTitle>
                  <CardDescription className="text-white/70">
                    Set final scores for completed games.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {loadingGames ? (
                    <p>Loading games...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20 hover:bg-white/10">
                          <TableHead className="text-white/80">Match</TableHead>
                          <TableHead className="text-white/80">League</TableHead>
                          <TableHead className="text-white/80">Game Time</TableHead>
                          <TableHead className="text-white/80">Status</TableHead>
                          <TableHead className="text-white/80">Final Score</TableHead>
                          <TableHead className="text-white/80 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {games.map((game) => (
                          <TableRow
                            key={game.id}
                            className="border-white/20 hover:bg-white/5"
                          >
                            <TableCell>
                              {game.team_a} vs {game.team_b}
                            </TableCell>

                            <TableCell>{game.league}</TableCell>

                            <TableCell>
                              {new Date(game.game_time).toLocaleString()}
                            </TableCell>

                            <TableCell>{game.status}</TableCell>

                            <TableCell>
                              {game.status === "scheduled" ||
                              game.status === "started" ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={game.result_a ?? ""}
                                    onChange={(e) =>
                                      handleResultChange(game.id, "result_a", e.target.value)
                                    }
                                    className="w-16 bg-white/20 border-white/30"
                                  />
                                  <span>-</span>
                                  <Input
                                    type="number"
                                    value={game.result_b ?? ""}
                                    onChange={(e) =>
                                      handleResultChange(game.id, "result_b", e.target.value)
                                    }
                                    className="w-16 bg-white/20 border-white/30"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveResult(game.id)}
                                  >
                                    Save
                                  </Button>
                                </div>
                              ) : (
                                `${game.result_a} - ${game.result_b}`
                              )}
                            </TableCell>

                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-cyan-300 hover:text-cyan-400"
                                onClick={() => openEditDialog(game)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Game?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the game and all
                                      associated predictions. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteGame(game.id)}
                                    >
                                      Confirm Delete
                                    </AlertDialogAction>
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
          {/* =========================
              SETTINGS TAB
          ========================== */}
          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* =========================
          EDIT GAME DIALOG
      ========================== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card text-white border-white/20">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
          </DialogHeader>

          {editingGame && (
            <form onSubmit={handleUpdateGame} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-team_a">Team A</Label>
                <Input
                  id="edit-team_a"
                  value={editingGame.team_a}
                  onChange={(e) =>
                    setEditingGame((prev) => ({ ...prev, team_a: e.target.value }))
                  }
                  className="bg-white/20 border-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-team_b">Team B</Label>
                <Input
                  id="edit-team_b"
                  value={editingGame.team_b}
                  onChange={(e) =>
                    setEditingGame((prev) => ({ ...prev, team_b: e.target.value }))
                  }
                  className="bg-white/20 border-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-game_time">Game Time</Label>
                <Input
                  id="edit-game_time"
                  type="datetime-local"
                  value={editingGame.game_time}
                  onChange={(e) =>
                    setEditingGame((prev) => ({ ...prev, game_time: e.target.value }))
                  }
                  className="bg-white/20 border-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-league">League</Label>
                <Select
                  value={editingGame.league}
                  onValueChange={(value) =>
                    setEditingGame((prev) => ({ ...prev, league: value }))
                  }
                >
                  <SelectTrigger className="bg-white/20 border-white/30">
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAGUE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
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
