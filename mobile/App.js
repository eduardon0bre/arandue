import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import MuralVagasScreen from './src/screens/MuralVagasScreen';
import NovaDemandaScreen from './src/screens/NovaDemandaScreen';
import MinhasDemandasScreen from './src/screens/MinhasDemandasScreen';
import BuscarDiaristasScreen from './src/screens/BuscarDiaristasScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import CurriculoScreen from './src/screens/CurriculoScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';
import NotificacoesScreen from './src/screens/NotificacoesScreen';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Header Customizado do Aranduê com Troca Rápida de Perfil de Teste e Botão de Notificações
 */
function ArandueHeader({ navigation }) {
  const insets = useSafeAreaInsets();
  const { usuario, alternarPerfilTeste } = useAuth();

  const getPerfilBadge = () => {
    switch (usuario?.tipo) {
      case 'contratante':
        return { label: 'Contratante', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'diarista':
        return { label: 'Diarista', bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' };
      case 'ambos':
      default:
        return { label: 'Ambos (Demo)', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
    }
  };

  const badge = getPerfilBadge();

  const handleProximoPerfil = () => {
    if (usuario?.tipo === 'contratante') {
      alternarPerfilTeste('diarista');
    } else if (usuario?.tipo === 'diarista') {
      alternarPerfilTeste('ambos');
    } else {
      alternarPerfilTeste('contratante');
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
      {/* Marca / Logo */}
      <View style={styles.headerLeft}>
        <View style={styles.logoBadge}>
          <Ionicons name="sparkles" size={18} color="#ffffff" />
        </View>
        <Text style={styles.brandTitle}>Aranduê</Text>
      </View>

      {/* Ações: Badge Troca de Perfil e Notificações */}
      <View style={styles.headerRight}>
        {/* Botão de Troca Rápida de Perfil de Teste */}
        <TouchableOpacity
          style={[
            styles.badgePerfil,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
          onPress={handleProximoPerfil}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={12} color={badge.color} style={{ marginRight: 4 }} />
          <Text style={[styles.badgePerfilText, { color: badge.color }]}>{badge.label}</Text>
        </TouchableOpacity>

        {/* Botão com Badge de Notificações */}
        <TouchableOpacity
          style={styles.btnNotificacoes}
          onPress={() => navigation.navigate('Notificacoes')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#f8fafc" />
          <View style={styles.badgeNumero}>
            <Text style={styles.badgeNumeroText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Tab Navigator Adaptativo de acordo com o Perfil do Usuário
 */
function MainTabs({ navigation }) {
  const { usuario } = useAuth();
  const tipo = usuario?.tipo || 'ambos';

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ArandueHeader navigation={navigation} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e2e8f0',
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        {/* 1. Vagas (Comum a todos) */}
        <Tab.Screen
          name="Vagas"
          component={MuralVagasScreen}
          options={{
            tabBarLabel: 'Vagas',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'briefcase' : 'briefcase-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* 2. Se Contratante ou Ambos: Criar Vaga */}
        {(tipo === 'contratante' || tipo === 'ambos') && (
          <Tab.Screen
            name="CriarVaga"
            component={NovaDemandaScreen}
            options={{
              tabBarLabel: 'Criar Vaga',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'add-circle' : 'add-circle-outline'}
                  size={size + 2}
                  color={color}
                />
              ),
            }}
          />
        )}

        {/* 3. Minhas Vagas / Inscrições */}
        <Tab.Screen
          name="MinhasDemandas"
          component={MinhasDemandasScreen}
          options={{
            tabBarLabel:
              tipo === 'diarista' ? 'Inscrições' : tipo === 'contratante' ? 'Minhas Vagas' : 'Gestão',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={
                  tipo === 'diarista'
                    ? focused
                      ? 'checkmark-done-circle'
                      : 'checkmark-done-circle-outline'
                    : focused
                    ? 'file-tray-full'
                    : 'file-tray-full-outline'
                }
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* 4. Se Contratante ou Ambos: Diaristas */}
        {(tipo === 'contratante' || tipo === 'ambos') && (
          <Tab.Screen
            name="Diaristas"
            component={BuscarDiaristasScreen}
            options={{
              tabBarLabel: 'Diaristas',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'people' : 'people-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        )}

        {/* 5. Se Diarista ou Ambos: Agenda */}
        {(tipo === 'diarista' || tipo === 'ambos') && (
          <Tab.Screen
            name="Agenda"
            component={AgendaScreen}
            options={{
              tabBarLabel: 'Agenda',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'calendar' : 'calendar-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        )}

        {/* 6. Se Diarista: Meu Currículo */}
        {tipo === 'diarista' && (
          <Tab.Screen
            name="Curriculo"
            component={CurriculoScreen}
            options={{
              tabBarLabel: 'Currículo',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'document-text' : 'document-text-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        )}

        {/* 7. Perfil e Configurações */}
        <Tab.Screen
          name="Configuracoes"
          component={ConfiguracoesScreen}
          options={{
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

function AppNavigator() {
  const { estaAutenticado } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!estaAutenticado ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Notificacoes"
              component={NotificacoesScreen}
              options={{
                title: 'Notificações & Alertas',
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#f8fafc',
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Ponto de entrada do Aplicativo Aranduê
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgePerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgePerfilText: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnNotificacoes: {
    position: 'relative',
    padding: 6,
  },
  badgeNumero: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNumeroText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
