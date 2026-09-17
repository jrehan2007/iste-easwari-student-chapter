export default function DashboardVideoBackground({ src = '/dashboard-bg.mp4' }: { src?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/intro-poster.jpg"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[#050B1A]/75" />
    </div>
  )
}
