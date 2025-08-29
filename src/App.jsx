import { createEffect, createResource, createSignal } from 'solid-js'
import solidLogo from './assets/solid.svg'
import './App.css'


function App() {
  const [ctmData] = createResource(async () => {
    const response = await fetch("./CTM448.CTM");
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("ISO-8859-1");
    return decoder.decode(buffer);
  });

  return (
    <pre>
      <code>{ctmData()}</code>
    </pre>
  )
}

export default App;
