
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

type ServicesResponse = {
  categories: Array<{ id: string; name: string }>;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: string | number;
    currency: string;
    estimatedTimeMinutes: number | null;
    pricingType: string;
  }>;
};

export default function HomeScreen() {
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userRole, setUserRole] = useState('');
  const [services, setServices] = useState<ServicesResponse | null>(null);
  const [message, setMessage] = useState('Request an OTP to begin.');
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    setLoading(true);
    setMessage('Requesting OTP...');
    setDevelopmentOtp('');
    setOtp('');

    try {
      const result = await apiRequest<OtpResponse>('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });

      if (result.developmentOtp) {
        setDevelopmentOtp(result.developmentOtp);
        setOtp(result.developmentOtp);
        setMessage(
          `OTP generated. It expires in ${result.expiresInSeconds} seconds. Development OTP filled in automatically.`,
        );
      } else {
        setMessage(
          `OTP requested. It expires in ${result.expiresInSeconds} seconds. Enter the code you receive.`,
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

  async function verifyOtp() {
    if (!otp.trim()) {
      setMessage('Enter the six-digit OTP first.');
      return;
    }

    setLoading(true);
    setMessage('Verifying OTP...');

    try {
      const result = await apiRequest<LoginResponse>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim(),
        }),
      });

      setAccessToken(result.accessToken);
      setUserRole(result.user.role);
      setMessage(`Login successful. Role: ${result.user.role}. Loading services...`);

      const serviceResult = await apiRequest<ServicesResponse>(
        '/customer/services',
        {},
        result.accessToken,
      );

      setServices(serviceResult);
      setMessage(
        `Authenticated successfully. Loaded ${serviceResult.services.length} services.`,
      );
    } catch (error) {
      setAccessToken('');
      setServices(null);
      setMessage(
        `Login or services request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshServices() {
    if (!accessToken) {
      setMessage('Please log in first.');
      return;
    }

    setLoading(true);
    setMessage('Loading services...');

    try {
      const result = await apiRequest<ServicesResponse>(
        '/customer/services',
        {},
        accessToken,
      );
      setServices(result);
      setMessage(`Loaded ${result.services.length} services successfully.`);
    } catch (error) {
      setMessage(
        `Services request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAccessToken('');
    setUserRole('');
    setServices(null);
    setOtp('');
    setDevelopmentOtp('');
    setMessage('Logged out. Request an OTP to sign in again.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>SERVIQ</Text>
      <Text style={styles.heading}>Customer Sign In</Text>
      <Text style={styles.subtitle}>
        Book trusted electrical services with transparent pricing.
      </Text>
      <Text style={styles.url}>API: {API_BASE_URL}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Mobile number</Text>
        <TextInput
          accessibilityLabel="Mobile number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="10-digit mobile number"
          style={styles.input}
          editable={!loading && !accessToken}
        />

        <Pressable
          accessibilityRole="button"
          disabled={loading || Boolean(accessToken)}
          onPress={requestOtp}
          style={({ pressed }) => [
            styles.button,
            (loading || Boolean(accessToken)) && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>Request OTP</Text>
        </Pressable>

        {Boolean(developmentOtp) && (
          <Text style={styles.devNotice}>
            Development mode: OTP received from the local API.
          </Text>
        )}

        <Text style={styles.label}>Six-digit OTP</Text>
        <TextInput
          accessibilityLabel="Six-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="Enter OTP"
          style={styles.input}
          editable={!loading && !accessToken}
        />

        <Pressable
          accessibilityRole="button"
          disabled={loading || Boolean(accessToken)}
          onPress={verifyOtp}
          style={({ pressed }) => [
            styles.button,
            styles.secondaryButton,
            (loading || Boolean(accessToken)) && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>Verify & Load Services</Text>
        </Pressable>

        {loading && (
          <ActivityIndicator
            style={styles.loader}
            color="#176B5B"
          />
        )}
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusHeading}>Connection status</Text>
        <Text selectable style={styles.statusText}>{message}</Text>
        {Boolean(userRole) && (
          <Text style={styles.role}>Signed-in role: {userRole}</Text>
        )}
      </View>

      {services && (
        <View style={styles.servicesSection}>
          <Text style={styles.sectionHeading}>Available services</Text>
          {services.services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {Boolean(service.description) && (
                <Text style={styles.serviceDescription}>
                  {service.description}
                </Text>
              )}
              <Text style={styles.price}>
                {service.currency} {service.price}
              </Text>
              <Text style={styles.serviceMeta}>
                {service.estimatedTimeMinutes ?? '—'} minutes · {service.pricingType}
              </Text>
            </View>
          ))}

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={refreshServices}
            style={[styles.button, styles.refreshButton]}
          >
            <Text style={styles.buttonText}>Refresh Services</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={logout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.footer}>
        Development build · Authentication token is held in memory only.
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
    fontSize: 16,
    fontWeight: '800',
    color: '#176B5B',
    letterSpacing: 3,
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
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8ED',
  },
  label: {
    marginBottom: 8,
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#303B4A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9DFE7',
    backgroundColor: '#FFFFFF',
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
  secondaryButton: {
    backgroundColor: '#243B53',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  devNotice: {
    marginTop: 10,
    fontSize: 12,
    color: '#8A5A00',
  },
  loader: {
    marginTop: 16,
  },
  statusCard: {
    marginTop: 18,
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
  role: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#176B5B',
  },
  servicesSection: {
    marginTop: 24,
  },
  sectionHeading: {
    marginBottom: 12,
    fontSize: 21,
    fontWeight: '800',
    color: '#18212F',
  },
  serviceCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8ED',
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18212F',
  },
  serviceDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#5D6675',
  },
  price: {
    marginTop: 12,
    fontSize: 21,
    fontWeight: '800',
    color: '#176B5B',
  },
  serviceMeta: {
    marginTop: 5,
    fontSize: 12,
    color: '#7A8493',
  },
  refreshButton: {
    marginTop: 8,
  },
  logoutButton: {
    alignItems: 'center',
    padding: 14,
    marginTop: 4,
  },
  logoutText: {
    color: '#A13D3D',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    marginBottom: 28,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: '#8A93A0',
  },
});
