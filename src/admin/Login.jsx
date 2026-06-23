import React from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../i18n';

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: '#2a1608',
  border: '1px solid #6b3f22',
  borderRadius: '8px',
  color: '#fef3e2',
  fontSize: '15px',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'Roboto, sans-serif',
};

function LangSwitcher({ lang, setLang }) {
  const flags = { tr: '🇹🇷', en: '🇬🇧', ar: '🇸🇦' };
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
      {['tr', 'en', 'ar'].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          type="button"
          style={{
            padding: '5px 12px',
            background: lang === code ? '#f59e0b' : 'transparent',
            color: lang === code ? '#fff' : '#c4956a',
            border: `1px solid ${lang === code ? '#f59e0b' : '#6b3f22'}`,
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: lang === code ? '700' : '400',
            fontFamily: 'Roboto, sans-serif',
          }}
        >
          {flags[code]} {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Login({ sessionMsg = '' }) {
  const { t, lang, setLang, isRTL } = useLanguage('manual');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError(t('loginError'));
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#3d2510',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Roboto, sans-serif',
      padding: '16px',
    }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{
        background: '#4a2e1a',
        border: '1px solid #6b3f22',
        borderRadius: '14px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Session expired banner */}
        {sessionMsg && (
          <div style={{
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f59e0b',
            fontSize: '13px',
            marginBottom: '20px',
            lineHeight: '1.5',
          }}>
            ⚠️ {sessionMsg}
          </div>
        )}

        <LangSwitcher lang={lang} setLang={setLang} />

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#fcd34d', fontFamily: 'Rye, cursive', fontSize: '22px', margin: '0 0 8px 0', letterSpacing: '1px' }}>
            DALTON'S KEBAP
          </h1>
          <p style={{ color: '#c4956a', margin: 0, fontSize: '13px' }}>{t('adminTitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#fef3e2', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
              {t('loginEmail')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#fef3e2', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
              {t('loginPassword')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(192,57,43,0.15)',
              border: '1px solid #c0392b',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#e74c3c',
              fontSize: '14px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: isLoading ? '#7a5a10' : '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              fontFamily: 'Roboto, sans-serif',
            }}
          >
            {isLoading ? t('loginLoading') : t('loginButton')}
          </button>
        </form>

        <p style={{ color: '#8b5e3c', fontSize: '12px', textAlign: 'center', marginTop: '24px', lineHeight: '1.6' }}>
          {t('loginHint')}
        </p>
      </div>
    </div>
  );
}
