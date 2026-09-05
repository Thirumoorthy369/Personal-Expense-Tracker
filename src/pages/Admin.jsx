import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi } from '../lib/storage';
import { ShieldAlert, Users, UserCheck, UserX, Key, Activity, Trash2, Edit2, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';

export function Admin() {
  const { user: currentUser, isAdmin } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    const userList = await storageApi.getUsers();
    const memberList = await storageApi.getWorkspaceMembers(activeWorkspace.id);
    setUsers(userList);
    setMembers(memberList);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [activeWorkspace.id, isAdmin]);

  // STRICT ACCESS GUARD FOR NON-ADMIN / NEW USERS
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-card border-2 border-rose-500/30 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-heading font-bold text-foreground">403 Access Denied</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The System Admin Console is strictly restricted. Only the primary administrator (<span className="font-mono text-rose-500 font-semibold">mr.thirumoorthys@gmail.com</span>) is granted access.
          </p>
        </div>
        <div className="p-3 bg-muted/40 rounded-xl text-[11px] font-mono text-muted-foreground">
          Logged in as: {currentUser?.email || 'Guest User'} (Standard User - Restricted)
        </div>
      </div>
    );
  }

  const handleToggleSuspend = async (usr) => {
    if (usr.email === 'mr.thirumoorthys@gmail.com') {
      return alert('Primary Super Admin account cannot be suspended.');
    }
    if (!window.confirm(`${usr.is_suspended ? 'Reactivate' : 'Suspend'} user ${usr.email}?`)) return;
    const updated = { ...usr, is_suspended: !usr.is_suspended };
    await storageApi.saveUser(updated);
    await loadAdminData();
  };

  const handleDeleteUser = async (usr) => {
    if (usr.email === 'mr.thirumoorthys@gmail.com') {
      return alert('Primary Super Admin account cannot be deleted.');
    }
    if (!window.confirm(`Permanently delete user account ${usr.email}? This action cannot be undone.`)) return;
    await storageApi.deleteUser(usr.id);
    await loadAdminData();
  };

  const handleChangeRole = async (usr, newRole) => {
    const updated = { ...usr, role: newRole };
    await storageApi.saveUser(updated);
    await loadAdminData();
  };

  const handleUpdateName = async (usr) => {
    const newName = prompt('Enter new display name:', usr.display_name);
    if (!newName) return;
    const updated = { ...usr, display_name: newName.trim() };
    await storageApi.saveUser(updated);
    await loadAdminData();
  };

  return (
    <div className="space-y-6">
      {/* 1. SUPER ADMIN PROFILE CARD (PROMINENT OWNER DISPLAY) */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-card to-card border-2 border-emerald-500/40 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold font-heading text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
            👑
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-bold text-foreground">
                {currentUser?.display_name || 'Thirumoorthy S'}
              </h2>
              <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                SUPER ADMIN & VAULT OWNER
              </span>
            </div>
            <p className="text-xs font-mono text-emerald-500 font-semibold">mr.thirumoorthys@gmail.com</p>
            <p className="text-[11px] text-muted-foreground">Primary Owner • Full System Control • User Management & Access Rights</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">System Status</span>
          <p className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Master Admin Active</span>
          </p>
        </div>
      </div>

      {/* 2. SYSTEM STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-muted-foreground font-medium">Total Registered Users</span>
          <p className="text-2xl font-bold font-mono text-foreground">{users.length}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-muted-foreground font-medium">Active Workspace Members</span>
          <p className="text-2xl font-bold font-mono text-emerald-500">{members.length}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-muted-foreground font-medium">Suspended Accounts</span>
          <p className="text-2xl font-bold font-mono text-rose-500">{users.filter(u => u.is_suspended).length}</p>
        </div>
      </div>

      {/* 3. USER DIRECTORY TABLE (WITH SUSPEND AND DELETE ACTIONS) */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-heading font-semibold text-foreground">Registered User Accounts & Access Control</h2>
          <span className="text-xs font-mono text-muted-foreground">{users.length} Total Registered Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-mono bg-muted/30">
                <th className="py-3 px-3">Display Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.map(usr => {
                const isPrimaryAdmin = usr.email === 'mr.thirumoorthys@gmail.com';

                return (
                  <tr key={usr.id} className={`hover:bg-muted/20 transition-colors ${isPrimaryAdmin ? 'bg-emerald-500/5' : ''}`}>
                    <td className="py-3 px-3 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{usr.display_name || 'User'}</span>
                        {!isPrimaryAdmin && (
                          <button onClick={() => handleUpdateName(usr)} className="p-0.5 text-muted-foreground hover:text-foreground">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      {usr.email}
                      {isPrimaryAdmin && <span className="ml-2 text-[10px] text-emerald-500 font-bold">(Primary Super Admin)</span>}
                    </td>
                    <td className="py-3 px-3">
                      {isPrimaryAdmin ? (
                        <span className="font-mono text-xs font-bold text-emerald-500 uppercase">SUPER ADMIN</span>
                      ) : (
                        <CustomSelect
                          options={[
                            { value: 'user', label: 'User' },
                            { value: 'admin', label: 'Admin' },
                            { value: 'super_admin', label: 'Super Admin' }
                          ]}
                          value={usr.role}
                          onChange={(val) => handleChangeRole(usr, val)}
                        />
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        usr.is_suspended ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {usr.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isPrimaryAdmin ? (
                        <span className="text-[10px] font-mono text-muted-foreground italic">Protected Master Account</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          {/* SUSPEND / REACTIVATE */}
                          <button
                            onClick={() => handleToggleSuspend(usr)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              usr.is_suspended
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                            }`}
                          >
                            {usr.is_suspended ? 'Reactivate' : 'Suspend'}
                          </button>

                          {/* DELETE USER */}
                          <button
                            onClick={() => handleDeleteUser(usr)}
                            className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
