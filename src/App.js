import React, { useEffect, useState } from "react";
import { VoyageProvider, Wallet, getLogicDriver } from 'js-moi-sdk';
import { info, success } from "./utils/toastWrapper";
import { Toaster } from "react-hot-toast";
import Loader from "./components/Loader";

// ------- Update with your credentials ------------------ //
const logicId = "0x08000073457b615a65e9e030a19bab50ff38b5cbff5304b63eb22bfff1f49296e24e89"
const mnemonic = "crumble congress bike jealous squirrel describe carry erase menu view very lesson"

const logicDriver = await gettingLogicDriver(
  logicId,
  mnemonic,
  "m/44'/6174'/7020'/0/0"
)

async function gettingLogicDriver(logicId, mnemonic, accountPath) {
  const provider = new VoyageProvider("babylon")
  const wallet = new Wallet(provider)
  await wallet.fromMnemonic(mnemonic, accountPath)
  return await getLogicDriver(logicId, wallet)
}

function App() {
  const [todoName, setTodoName] = useState("");
  const [todos, setTodos] = useState([]);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing,setEditing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [deleting,setDeleting] = useState(false);

  useEffect(() => {
    getTodos();
  }, []);

  const handleTodoName = (e) => {
    setTodoName(e.currentTarget.value);
  };

  const getTodos = async () => {
    try {
      const tTodos = await logicDriver.persistentState.get("todos")
      setTodos(tTodos)
      setLoading(false);
    } catch (error) {
      setLoading(false)
      console.log(error);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!todoName.trim()) {
      alert("Please enter a non-empty task");
      return;
    }
    try {
      setAdding(true)
      info("Adding Todo ...");
      
      const ix = await logicDriver.routines.Add([todoName]).send({
        fuelPrice: 1,
        fuelLimit: 1000,
      });

      // Waiting for tesseract to be mined
      await ix.wait()
      
      await getTodos()
      success("Successfully Added");
      setTodoName("")
      setAdding(false)
    } catch (error) {
      console.log(error);
    }
  };

  const markCompleted = async (id) => {
    try {
      setMarking(id)
      const ix = await logicDriver.routines.MarkTodoCompleted([id]).send({
        fuelPrice: 1,
        fuelLimit: 1000,
      });
      // Waiting for tesseract to be mined
      await ix.wait();
      
      const tTodos = [...todos];
      tTodos[id].completed = true;
      setTodos(tTodos);
      setMarking(false)
    } catch (error) {
      console.log(error);
    }
  };

  const deleteTodo = async (id) =>{
    try {
      setDeleting(id)
      const ix = await logicDriver.routines.MarkTodoDeleted([id]).send({
        fuelPrice: 1,
        fuelLimit: 1000,
      });
      // Waiting for tesseract to be mined
      await ix.wait();
      
      const tTodos = [...todos];
      tTodos[id].deleted = true;
      setTodos(tTodos);
      setDeleting(false)
    } catch (error) {
      console.log(error);
    }
  };

  const editTodo = async (id) =>{
    if (!todoName.trim()) {
      alert("Please enter a non-empty task");
      return;
    }
    try {
      setEditing(id)
      info("Editing Todo ...");
      
      const ix = await logicDriver.routines.MarkEdited([id,todoName]).send({
        fuelPrice: 1,
        fuelLimit: 1000,
      });

      // Waiting for tesseract to be mined
      await ix.wait()
      
      await getTodos()
      success("Successfully Edited");
      setTodoName("")
      setEditing(false)
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Toaster />
      <section class="section-center">
        <form class="todo-form">
          <p class="alert"></p>
          <h3>Todo buddy</h3>
          <div class="form-control">
            <input
              value={todoName}
              name="todoName"
              onChange={handleTodoName}
              type="text"
              id="todo"
              placeholder="e.g. Attend Moi Event"
            />
            <button onClick={add} type="submit" class="submit-btn">
            {adding ? <Loader color={"#000"} loading={adding} /> :"Add Todo"}
            </button>
          </div>
        </form>
        {!loading ? <div class="todo-container show-container">
          {todos.map((todo, index) => {
            return (
              <div class="todo-list">
                {todo.name}
                {todo.completed ? (
                  <img className="icon" src="/images/check.svg" />
                ) : todo.deleted ? (
                  <span>
                    <img className="icon" src="/images/X_mark.svg"></img>
                  </span>
                ) : (
                  <span
                    onClick={() => markCompleted(index)}
                    className="underline text-red pointer"
                  >
                    {marking === index? <Loader color={"#000"} loading={marking === 0 ? true:marking} /> :"Mark Completed!"}
                  </span>
                )}
                {
                  todo.deleted ? (
                    <span className="underline text-green disabled">DELETED</span>
                  ) : (
                    <span onClick={()=>deleteTodo(index)} className="underline text-red pointer">
                      {deleting === index? <Loader color={"#000"} loading={deleting === 0 ? true:deleting} /> :"DELETE"}
                    </span>
                  )
                }
                {
                  todo.deleted ? (
                    <span className="underline text-red disabled">
                      Cant Edit
                    </span>
                  )
                  :
                  ( <span onClick={()=>editTodo(index)} className="underline text-red pointer">
                       {editing === index? <Loader color={"#000"} loading={editing === 0 ? true:editing} /> :"Edit"}
                    </span>
                )
                }
              </div>
            );
          })}
        </div> 
        : 
        <div style={{marginTop:"20px"}}>
          <Loader color={"#000"} loading={loading} />  
        </div>}
      </section>
    </>
  );
}

export default App;
