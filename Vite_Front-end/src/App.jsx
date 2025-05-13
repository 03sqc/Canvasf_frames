import './App.css'
import { useRoutes } from "react-router-dom";
import router from "./router/index";
const App =()=>{
  const element  = useRoutes(router)
  return (
    <div className="App">
      {
        element
      }
    </div>
  );
}

export default App
