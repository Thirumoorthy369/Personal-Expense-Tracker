import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { storageApi } from '../lib/storage';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeMemberRole, setActiveMemberRole] = useState('admin');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspaces() {
      const effectiveUserId = user?.id || 'user-default-001';
      const wsList = await storageApi.getWorkspaces(effectiveUserId);
      setWorkspaces(wsList);

      const savedWsId = localStorage.getItem('pt_active_ws_id');
      const targetWs = wsList.find(w => w.id === savedWsId) || wsList[0];

      if (targetWs) {
        await selectWorkspace(targetWs, wsList);
      } else {
        // Create default workspace if none exist
        const newWs = await storageApi.createWorkspace({
          name: `${user?.display_name || 'Personal'}'s Vault`,
          owner_id: effectiveUserId,
          currency: 'INR'
        });
        setWorkspaces([newWs]);
        await selectWorkspace(newWs, [newWs]);
      }
      setLoading(false);
    }
    loadWorkspaces();
  }, [user]);

  async function selectWorkspace(ws, currentWsList = workspaces) {
    setActiveWorkspace(ws);
    localStorage.setItem('pt_active_ws_id', ws.id);

    // Fetch members and calculate role
    const wsMembers = await storageApi.getWorkspaceMembers(ws.id);
    setMembers(wsMembers);

    const isOwner = !ws.owner_id || ws.owner_id === user?.id || ws.owner_id === 'user-default-001' || (user?.id && ws.owner_id && ws.owner_id.includes(user.id.slice(0, 8)));
    const isSuperAdmin = !user || user.role === 'super_admin' || user.role === 'admin' || user.email?.toLowerCase() === 'mr.thirumoorthys@gmail.com';

    if (isOwner || isSuperAdmin) {
      setActiveMemberRole('admin');
    } else {
      const myMembership = wsMembers.find(m => m.user_id === user?.id || m.user_email === user?.email);
      setActiveMemberRole(myMembership?.role || 'admin');
    }
  }

  const createWorkspace = async (name, currency = 'INR') => {
    if (!user) return;
    const newWs = await storageApi.createWorkspace({
      name,
      owner_id: user.id,
      currency
    });
    const updated = [...workspaces, newWs];
    setWorkspaces(updated);
    await selectWorkspace(newWs, updated);
    return newWs;
  };

  const inviteMember = async (email, role = 'viewer') => {
    if (!activeWorkspace) return;
    const newMember = {
      id: 'm-' + Date.now(),
      workspace_id: activeWorkspace.id,
      user_email: email,
      role,
      created_at: new Date().toISOString()
    };
    await storageApi.saveEntity('workspace_members', newMember);
    const updated = await storageApi.getWorkspaceMembers(activeWorkspace.id);
    setMembers(updated);
    return newMember;
  };

  const isWorkspaceAdmin = activeMemberRole === 'admin';
  const isWorkspaceViewer = activeMemberRole === 'viewer';

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      activeMemberRole,
      members,
      loading,
      selectWorkspace,
      createWorkspace,
      inviteMember,
      isWorkspaceAdmin,
      isWorkspaceViewer
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
