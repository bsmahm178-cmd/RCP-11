import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router/AppRouter";
import "./style.css";
import Users from "./pages/admin/Users";


function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;