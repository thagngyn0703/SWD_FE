import logo from './logo.svg';
import './App.css';
import Header from './components/Header';
import AppContent from './components/AppContent';
import LoginForm from './components/Login';
import RegisterForm from './components/Register';
function App() {
  return (
    <div className="App">
     <Header pageTitle="frondend authenticated with JWT" logoSrc={logo}/>
    <AppContent/>
    <LoginForm/>
    <RegisterForm/>
    </div>
  );
}

export default App;
