import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.\' '.split('');
const MAX_ATTEMPTS = 5;
const TOTAL_CHARACTERS = 826;

export default function JuegoRickAndMorty() {
  const [characterName, setCharacterName] = useState('');
  const [characterImage, setCharacterImage] = useState('');
  const [characterId, setCharacterId] = useState('');
  const [characterHint, setCharacterHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userWin, setUserWin] = useState(0);
  const [userLose, setUserLose] = useState(0);
  const [uid, setUid] = useState(null);

  // Escuchar el login del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  // Obtener datos del usuario desde Firestore
  useEffect(() => {
    if (!uid) return;
    const traerDatos = async () => {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserWin(data.ganados || 0);
        setUserLose(data.perdidos || 0);
      } else {
        await setDoc(docRef, { ganados: 0, perdidos: 0 });
        setUserWin(0);
        setUserLose(0);
      }
      setLoading(false);
    };
    traerDatos();
  }, [uid]);

  // Guardar resultado en Firestore
  const guardarResultado = async (acierto) => {
    if (!uid) return;
    const fecha = new Date().toISOString();

    const resultado = {
      uid,
      personaje: characterName,
      aciertos: acierto ? 1 : 0,
      errores: acierto ? 0 : 1,
      fecha,
    };

    try {
      await setDoc(doc(db, 'resultados', `${uid}_${fecha}`), resultado);

      const docRef = doc(db, 'usuarios', uid);
      await updateDoc(docRef, {
        ganados: acierto ? userWin + 1 : userWin,
        perdidos: !acierto ? userLose + 1 : userLose,
      });
    } catch (e) {
      console.error('Error al guardar resultado:', e);
    }
  };

  // Normaliza tildes y caracteres raros para que coincidan con el teclado
  const limpiarNombre = (nombre) =>
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

  // Obtener personaje aleatorio de Rick and Morty API
  const getRandomCharacter = async () => {
    const id = Math.floor(Math.random() * TOTAL_CHARACTERS) + 1;
    try {
      const response = await fetch(
        `https://rickandmortyapi.com/api/character/${id}`
      );
      const data = await response.json();

      setCharacterName(limpiarNombre(data.name));
      setCharacterId(data.id);
      setCharacterImage(data.image);
      setCharacterHint(`${data.species} • ${data.status}`);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener el personaje:', err);
    }
  };

  useEffect(() => {
    getRandomCharacter();
  }, []);

  const handleLetterClick = async (letter) => {
    if (guessedLetters.includes(letter) || gameOver || gameWon) return;

    const updatedGuessed = [...guessedLetters, letter];
    setGuessedLetters(updatedGuessed);

    if (!characterName.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);
      if (newWrongGuesses >= MAX_ATTEMPTS) {
        setGameOver(true);
        setUserLose(userLose + 1);
        await guardarResultado(false);
      }
    } else {
      const allCorrect = characterName
        .split('')
        .every((l) => l === ' ' || updatedGuessed.includes(l));

      if (allCorrect) {
        setGameWon(true);
        setUserWin(userWin + 1);
        await guardarResultado(true);
      }
    }
  };

  const renderWord = () =>
    characterName.split('').map((letter, index) => {
      if (letter === ' ') {
        return (
          <Text key={index} style={styles.space}>
            {'   '}
          </Text>
        );
      }
      return (
        <Text key={index} style={styles.letter}>
          {guessedLetters.includes(letter) || gameOver || gameWon ? letter : '_'}
        </Text>
      );
    });

  const restartGame = () => {
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameOver(false);
    setGameWon(false);
    setLoading(true);
    setCharacterName('');
    setCharacterId('');
    setCharacterImage('');
    setCharacterHint('');
    getRandomCharacter();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adivina el Personaje</Text>
      <Text style={styles.subtitle}>Rick and Morty Edition</Text>
      <Text style={styles.stats}>
        Ganados: {userWin} | Perdidos: {userLose}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00b5cc" />
      ) : (
        <>
          <Text style={styles.idText}>#{characterId} — {characterHint}</Text>
          {characterImage ? (
            <Image source={{ uri: characterImage }} style={styles.image} />
          ) : null}

          <View style={styles.wordContainer}>{renderWord()}</View>

          <View style={styles.keyboard}>
            {ALPHABET.map((letter) => (
              <TouchableOpacity
                key={letter}
                onPress={() => handleLetterClick(letter)}
                disabled={guessedLetters.includes(letter) || gameOver || gameWon}
                style={[
                  styles.key,
                  guessedLetters.includes(letter) && styles.keyDisabled,
                ]}
              >
                <Text style={styles.keyText}>
                  {letter === ' ' ? '␣' : letter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.attempts}>
            Fallos: {wrongGuesses} / {MAX_ATTEMPTS}
          </Text>

          {gameOver && (
            <Text style={styles.lost}>💀 ¡Perdiste! Era: {characterName}</Text>
          )}
          {gameWon && <Text style={styles.won}>🛸 ¡Wubba Lubba Dub Dub! ¡Ganaste!</Text>}

          {(gameOver || gameWon) && (
            <TouchableOpacity style={styles.button} onPress={restartGame}>
              <Text style={styles.buttonText}>Jugar otra vez</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#00b5cc', fontWeight: '600', marginBottom: 10 },
  stats: { marginBottom: 10, fontSize: 16, fontWeight: 'bold' },
  idText: { fontSize: 14, color: '#555', marginBottom: 5 },
  image: { width: 160, height: 160, marginVertical: 10, borderRadius: 12 },
  wordContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  letter: { fontSize: 24, marginHorizontal: 3, fontWeight: 'bold' },
  space: { fontSize: 24, marginHorizontal: 4 },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  key: {
    backgroundColor: '#eee',
    padding: 10,
    margin: 3,
    borderRadius: 6,
    width: 38,
    alignItems: 'center',
  },
  keyDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  keyText: { fontWeight: '600' },
  attempts: { fontSize: 16, marginBottom: 10 },
  lost: { color: 'red', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  won: { color: 'green', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  button: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#00b5cc',
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});