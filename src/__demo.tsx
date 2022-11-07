import { type ChangeEvent, type FormEvent, StrictMode, useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createGlobalStyle } from 'styled-components';

import { createFactor, useFactor, useOptionalFactor } from './index.js';

const GlobalStyle = createGlobalStyle`
  body {
    color: #ccc;
    background: black;
    font-family: Arial, Helvetica, sans-serif;
  }

  main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h1 {
    font-size: 1.5rem;
    text-decoration: underline;
    margin: 0;
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

const useTodos = () => {
  const id = useRef(0);
  const [todos, setTodos] = useState<Readonly<Record<string, string>>>(Object.create(null));

  const addTodo = useCallback((todo: string) => {
    setTodos((current) => {
      const noteId = `${(id.current += 1)}`;
      return { ...current, [noteId]: todo };
    });
  }, []);

  const removeTodo = useCallback((noteId: string) => {
    setTodos((current) => {
      const next: Record<string, string> = Object.create(null);
      Object.entries(current).forEach(([key, value]) => {
        if (key !== noteId) {
          next[key] = value;
        }
      });
      return next;
    });
  }, []);

  return { addTodo, removeTodo, todos };
};

const TodoFactor = createFactor(useTodos);

const Todo = (props: { todoId: string }) => {
  const { todoId } = props;
  const [todo, removeTodo] = useFactor(
    TodoFactor,
    [
      // Tuple Array
      (value) => value.todos[todoId],
      (value) => value.removeTodo,
    ],
    [todoId],
  );
  const onClick = useCallback(() => removeTodo(todoId), [removeTodo, todoId]);

  return (
    <>
      <button onClick={onClick}>
        <strong>✓</strong>
      </button>
      <div>{todo} </div>
    </>
  );
};

const TodoList = () => {
  const todoIds = useFactor(TodoFactor, (value) => Object.keys(value.todos));

  return (
    <div>
      <ul>
        {todoIds.length ? (
          todoIds.map((todoId) => (
            <li key={todoId}>
              <Todo todoId={todoId} />
            </li>
          ))
        ) : (
          <li>
            <em>All done!</em>
          </li>
        )}
      </ul>
    </div>
  );
};

const NewTodo = () => {
  const addTodo = useFactor(TodoFactor, (value) => value.addTodo);
  const [todo, setTodo] = useState('');
  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTodo(event.target.value);
  }, []);
  const onSave = useCallback(
    (event: FormEvent) => {
      event.preventDefault();

      const trimmed = todo.trim();

      if (trimmed) {
        addTodo(trimmed);
        setTodo('');
      }
    },
    [todo, addTodo],
  );

  return (
    <form onSubmit={onSave}>
      <input value={todo} onChange={onChange} />
      <button type="submit">Save</button>
    </form>
  );
};

createRoot(document.body.appendChild(document.createElement('div'))).render(
  <StrictMode>
    <GlobalStyle />
    <main>
      <TodoFactor>
        <div>
          <u>Todo List</u>
        </div>
        <TodoList />
        <NewTodo />
      </TodoFactor>
      <NestingFactor>
        <NestingFactor>
          <NestingCount />
        </NestingFactor>
      </NestingFactor>
    </main>
  </StrictMode>,
);
