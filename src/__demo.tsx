import { type ChangeEvent, type FormEvent, StrictMode, useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createGlobalStyle } from 'styled-components';

import { createFactor, useFactor, useFactorStatus, useOptionalFactor } from './index.js';

const GlobalStyle = createGlobalStyle`
  body {
    color: #ccc;
    background: black;
    font-family: Arial, Helvetica, sans-serif;
  }

  ul {
    list-style: none;
    padding-inline-start: 1rem;
  }

  li {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const NestingFactor = createFactor((): number => {
  return useOptionalFactor(NestingFactor, (value = 0) => value + 1);
});

const NestingCount = () => {
  const count = useOptionalFactor(NestingFactor);
  return <div>Nesting Count: {count}</div>;
};

const useNotes = () => {
  const id = useRef(0);
  const [notes, setNotes] = useState<Readonly<Record<string, string>>>(Object.create(null));
  const factorStatus = useFactorStatus();
  console.log('Factor Status: ' + factorStatus);

  const addNote = useCallback((note: string) => {
    setNotes((current) => {
      const noteId = `${(id.current += 1)}`;
      return { ...current, [noteId]: note };
    });
  }, []);

  const removeNote = useCallback((noteId: string) => {
    setNotes((current) => {
      const next: Record<string, string> = Object.create(null);
      Object.entries(current).forEach(([key, value]) => {
        if (key !== noteId) {
          next[key] = value;
        }
      });
      return next;
    });
  }, []);

  return { addNote, notes, removeNote };
};

const Notes = createFactor(useNotes);

const Note = (props: { note: string; noteId: string; removeNote: (noteId: string) => void }) => {
  const { note, noteId, removeNote } = props;
  const remove = useCallback(() => removeNote(noteId), [removeNote, noteId]);

  return (
    <>
      <button onClick={remove}>
        <strong>✕</strong>
      </button>
      <div>{note} </div>
    </>
  );
};

const NoteList = () => {
  const [notes, removeNote] = useFactor(Notes, [
    // Tuple
    (value) => value.notes,
    (value) => value.removeNote,
  ]);

  return (
    <div>
      <ul style={{ listStyle: 'none' }}>
        {Object.entries(notes).map(([noteId, note]) => (
          <li key={noteId}>
            <Note note={note} noteId={noteId} removeNote={removeNote} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const NewNote = () => {
  const addNote = useFactor(Notes, (value) => value.addNote);
  const [note, setNote] = useState('');
  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setNote(event.target.value);
  }, []);
  const onSave = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      addNote(note);
      setNote('');
    },
    [note, addNote],
  );

  return (
    <form onSubmit={onSave}>
      <input value={note} onChange={onChange} />
      <button type="submit">Save</button>
    </form>
  );
};

createRoot(document.body.appendChild(document.createElement('div'))).render(
  <StrictMode>
    <GlobalStyle />
    <Notes>
      <h1>Notes</h1>
      <NoteList />
      <NewNote />
    </Notes>
    <NestingFactor>
      <NestingFactor>
        <NestingCount />
      </NestingFactor>
    </NestingFactor>
  </StrictMode>,
);
