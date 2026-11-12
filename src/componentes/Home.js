import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';

export default function Home() {
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        // Trae la primera página de personajes (20) o puedes pedir más con /1,2,3...
        const res = await fetch('https://rickandmortyapi.com/api/character');
        const json = await res.json();
        setData(json.results);
      } catch (error) {
        console.error('Error al cargar personajes:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, []);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#00b5cc" />
      </View>
    );
  }

  return (
    <ScrollView>
      <Text style={styles.titulo}>Personajes de Rick y Morty</Text>
      <View style={styles.lista}>
        {data.map((personaje) => (
          <View key={personaje.id} style={styles.item}>
            <Image source={{ uri: personaje.image }} style={styles.imagen} />
            <Text style={styles.nombre}>
              #{personaje.id} - {personaje.name}
            </Text>
            <Text style={styles.detalle}>
              {personaje.species} • {personaje.status}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#222',
  },
  lista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  item: {
    backgroundColor: '#e8f7fa',
    width: '48%',
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  imagen: {
    width: 110,
    height: 110,
    borderRadius: 8,
    marginBottom: 8,
  },
  nombre: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  detalle: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
    textAlign: 'center',
  },
});