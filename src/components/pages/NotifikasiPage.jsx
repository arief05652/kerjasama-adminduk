import './pages.css'

const NOTIFICATIONS = [
  {
    id: 1,
    title: 'Kerjasama akan berakhir',
    message: 'PKS Adminduk 2024 berakhir dalam 14 hari.',
    time: '5 menit lalu',
    unread: true,
  },
  {
    id: 2,
    title: 'Akses pengguna baru',
    message: 'Sari mengakses dashboard dari jaringan lokal.',
    time: '1 jam lalu',
    unread: true,
  },
  {
    id: 3,
    title: 'Berkas diperbarui',
    message: 'laporan.txt diubah di folder Dokumen.',
    time: 'Kemarin',
    unread: false,
  },
]

function NotifikasiPage() {
  return (
    <section className="page">
      <header className="page-head">
        <h2>Notifikasi</h2>
        <p>Pemberitahuan masa berlaku kerjasama dan aktivitas akses.</p>
      </header>

      <ul className="notif-list">
        {NOTIFICATIONS.map((item) => (
          <li key={item.id} className={`notif ${item.unread ? 'unread' : ''}`}>
            <span className="notif-dot" aria-hidden="true" />
            <div className="notif-body">
              <div className="notif-title">{item.title}</div>
              <div className="notif-message">{item.message}</div>
            </div>
            <span className="notif-time">{item.time}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default NotifikasiPage
