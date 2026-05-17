export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full flex flex-col items-center space-y-6 text-center">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">CollabSwipe Web API</h1>
        <p className="text-lg text-muted-foreground">
          Vite + React + Tailwind CSS entegrasyonumuz başarıyla çalışıyor! 
        </p>
        <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm w-full text-left">
          <p className="text-sm font-medium mb-2">Sıradaki adımlar:</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Web arayüzünü tasarlamaya başla.</li>
            <li>Mobil uygulama (Expo) ile API'ye bağlan.</li>
            <li>Routing ve bileşenleri ekle.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
