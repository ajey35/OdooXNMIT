export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <h1 className="text-2xl font-bold text-primary">Shiv Accounts Cloud</h1>
        <p className="text-muted-foreground">Loading your accounting system...</p>
      </div>
    </div>
  )
}
