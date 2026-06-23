import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../i18n';
import Login from './Login';
import AdminPanel from './AdminPanel';

export default function AdminRoot() {
  const [user, setUser] = React.useState(undefined);
  const [sessionMsg, setSessionMsg] = React.useState('');
  const { t } = useLanguage('manual');

  React.useEffect(() => {
    document.body.style.background = '#3d2510';
    document.body.style.backgroundImage = 'none';
    document.body.className = '';
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundImage = '';
    };
  }, []);

  React.useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setSessionMsg('');
    });
  }, []);

  if (user === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#3d2510', color: '#fcd34d', fontFamily: 'Roboto, sans-serif' }}>
        <div>{t('loading')}</div>
      </div>
    );
  }

  if (!user) return <Login sessionMsg={sessionMsg} />;
  return <AdminPanel user={user} onInactivityLogout={() => setSessionMsg(t('sessionExpired'))} />;
}
