
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { API_BASE_URL, apiRequest } from '@/lib/api';

type OtpResponse = {
  message: string;
  expiresInSeconds: number;
  developmentOtp?: string;
};

type LoginResponse = {
  message: string;
  accessToken: string;
  user: {
    id: string;
    phone: string;
    role: string;
    status: string;
    organizationId: string | null;
  };
};

type PartnerProfileResponse = {
  partner: {
    id: string;
    partnerCode?: string;
    status?: string;
    verificationStatus?: string;
    [key: string]: unknown;
  };
  user: {
    id: string;
    phone: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
    status: string;
  };
  availability: {
    isOnline: boolean;
    isBusy: boolean;
    latitude: number | null;
    longitude: number | null;
    lastSeenAt: string | null;
  } | null;
};

type AvailabilityResponse = {
  partnerId: string;
  isOnline: boolean;
  isBusy: boolean;
  latitude: number | null;
  longitude: number | null;
  lastSeenAt: string | null;
};

export default function HomeScreen() {
  const [phone, setPhone] = useState('9111164560');
  const [otp, setOtp] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [profile, setProfile] = useState<PartnerProfileResponse | null>(null);
  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null);
  const [message, setMessage] = useState('Sign in to manage your availability.');
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    setLoading(true);
    setMessage('Requesting OTP...');
    setOtp('');

    try {
      const result = await apiRequest<OtpResponse>('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });

      if (result.developmentOtp) {
        setOtp(result.developmentOtp);
        setMessage(
          `Development OTP received. Expires in ${result.expiresInSeconds} seconds.`,
        );
      } else {
        setMessage(
          `OTP requested. Enter the code you receive. Expires in ${result.expiresInSeconds} seconds.`,
        );
      }
    } catch (error) {
      setMessage(
        `OTP request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    if (otp.trim().length !== 6) {
      setMessage('Enter the six-digit OTP first.');
      return;
    }

    setLoading(true);
    setMessage('Verifying OTP...');

    try {
      const result = await apiRequest<LoginResponse>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });

      if (result.user.role !== 'PARTNER') {
        setMessage(
          `This account has role ${result.user.role}, not PARTNER. Use a registered partner account.`,
        );
        return;
      }

      setAccessToken(result.accessToken);

      const [profileResult, availabilityResult] = await Promise.all([
        apiRequest<PartnerProfileResponse>(
          '/partner/profile',
          {},
          result.accessToken,
        ),
        apiRequest<AvailabilityResponse>(
          '/partner/availability',
          {},
          result.accessToken,
        ),
      ]);

      setProfile(profileResult);
      setAvailability(availabilityResult);
      setMessage('Partner login successful. Profile and availability loaded.');
    } catch (error) {
      setAccessToken('');
      setProfile(null);
      setAvailability(null);
      setMessage(
        `Login failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeAvailability(isOnline: boolean) {
    if (!accessToken) {
      setMessage('Please sign in first.');
      return;
    }

    setLoading(true);
    setMessage(`Updating availability to ${isOnline ? 'online' : 'offline'}...`);

    try {
      const result = await apiRequest<AvailabilityResponse>(
        '/partner/availability',
        {
          method: 'POST',
          body: JSON.stringify({ isOnline }),
        },
        accessToken,
      );

      setAvailability(result);
      setMessage(
        `Availability updated. You are now ${result.isOnline ? 'online' : 'offline'}.`,
      );
    } catch (error) {
      setMessage(
        `Availability update failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshAvailability() {
    if (!accessToken) return;

    setLoading(true);
    try {
      const [profileResult, availabilityResult] = await Promise.all([
        apiRequest<PartnerProfileResponse>(
          '/partner/profile',
          {},
          accessToken,
        ),
        apiRequest<AvailabilityResponse>(
          '/partner/availability',
          {},
          accessToken,
        ),
      ]);

      setProfile(profileResult);
      setAvailability(availabilityResult);
      setMessage('Partner profile and availability refreshed.');
    } catch (error) {
      setMessage(
        `Refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAccessToken('');
    setOtp('');
    setProfile(null);
    setAvailability(null);
    setMessage('Signed out. Your server-side availability was not changed.');
  }

  const displayName = [
    profile?.user.firstName,
    profile?.user.lastName,
  ].filter(Boolean).join(' ');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>SERVIQ PARTNER</Text>
      <Text style={styles.heading}>Partner Workspace</Text>
      <Text style={styles.subtitle}>
        Manage your service availability and partner profile.
      </Text>
      <Text style={styles.url}>API: {API_BASE_URL}</Text>

      {!accessToken && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Partner sign in</Text>
          <Text style={styles.label}>Registered mobile number</Text>
          <TextInput
            accessibilityLabel="Registered mobile number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
            placeholder="10-digit mobile number"
            style={styles.input}
          />

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={requestOtp}
            style={[styles.button, loading && styles.disabled]}
          >
            <Text style={styles.buttonText}>Request OTP</Text>
          </Pressable>

          <Text style={styles.label}>Six-digit OTP</Text>
          <TextInput
            accessibilityLabel="Six-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
            placeholder="Enter OTP"
            style={styles.input}
          />

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={login}
            style={[styles.button, styles.loginButton, loading && styles.disabled]}
          >
            <Text style={styles.buttonText}>Verify & Sign In</Text>
          </Pressable>
        </View>
      )}

      {loading && (
        <ActivityIndicator style={styles.loader} color="#176B5B" />
      )}

      <View style={styles.statusCard}>
        <Text style={styles.statusHeading}>Status</Text>
        <Text selectable style={styles.statusText}>{message}</Text>
      </View>

      {profile && availability && (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Partner profile</Text>
            <Text style={styles.name}>
              {displayName || profile.user.phone}
            </Text>
            <Text style={styles.detail}>Phone: {profile.user.phone}</Text>
            <Text style={styles.detail}>Role: {profile.user.role}</Text>
            <Text style={styles.detail}>Account status: {profile.user.status}</Text>
            <Text style={styles.detail}>
              Partner status: {profile.partner.status ?? 'Not provided'}
            </Text>
            {profile.partner.partnerCode && (
              <Text style={styles.detail}>
                Partner code: {profile.partner.partnerCode}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Service availability</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  availability.isOnline ? styles.onlineDot : styles.offlineDot,
                ]}
              />
              <Text style={styles.availabilityText}>
                {availability.isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
              <View style={styles.spacer} />
              <Text style={styles.busyText}>
                {availability.isBusy ? 'On a job' : 'Not busy'}
              </Text>
            </View>

            <Text style={styles.description}>
              Go online when you are ready to receive eligible service requests.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={loading || availability.isBusy}
              onPress={() => changeAvailability(!availability.isOnline)}
              style={[
                styles.button,
                availability.isOnline ? styles.offlineButton : styles.onlineButton,
                (loading || availability.isBusy) && styles.disabled,
              ]}
            >
              <Text style={styles.buttonText}>
                {availability.isBusy
                  ? 'Finish current job before changing status'
                  : availability.isOnline
                    ? 'Go Offline'
                    : 'Go Online'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={refreshAvailability}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>Refresh profile & availability</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={logout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </>
      )}

      <Text style={styles.footer}>
        Development build · Access token is held in memory only.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#F7F8FA',
  },
  brand: {
    fontSize: 15,
    fontWeight: '800',
    color: '#176B5B',
    letterSpacing: 2,
    marginBottom: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#18212F',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#5D6675',
  },
  url: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 11,
    color: '#7A8493',
  },
  card: {
    padding: 18,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8ED',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18212F',
    marginBottom: 14,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#303B4A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9DFE7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#18212F',
  },
  button: {
    marginTop: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    backgroundColor: '#176B5B',
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#243B53',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  loader: {
    marginVertical: 12,
  },
  statusCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EAF4F1',
  },
  statusHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#176B5B',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#18212F',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18212F',
    marginBottom: 8,
  },
  detail: {
    marginTop: 6,
    fontSize: 13,
    color: '#5D6675',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  onlineDot: {
    backgroundColor: '#159447',
  },
  offlineDot: {
    backgroundColor: '#9099A6',
  },
  availabilityText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18212F',
  },
  spacer: {
    flex: 1,
  },
  busyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5D6675',
  },
  description: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: '#5D6675',
  },
  onlineButton: {
    backgroundColor: '#176B5B',
  },
  offlineButton: {
    backgroundColor: '#7A4141',
  },
  refreshButton: {
    padding: 14,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#176B5B',
  },
  logoutButton: {
    padding: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A13D3D',
  },
  footer: {
    marginTop: 8,
    marginBottom: 28,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: '#8A93A0',
  },
});
