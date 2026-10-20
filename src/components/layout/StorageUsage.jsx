import { formatBytes } from '../../lib/format'
import './StorageUsage.css'

function StorageUsage({ usage }) {
  if (!usage) return null

  const { total, used, free } = usage.device
  const percent = total ? Math.min(100, (used / total) * 100) : 0
  const level = percent >= 90 ? 'danger' : percent >= 75 ? 'warn' : 'ok'

  return (
    <div className="storage">
      <div className="storage-head">
        <span>Penyimpanan</span>
        <span>{percent.toFixed(0)}%</span>
      </div>

      <div
        className="storage-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <span className={`storage-fill ${level}`} style={{ width: `${percent}%` }} />
      </div>

      <div className="storage-text">
        {formatBytes(used)} terpakai · {formatBytes(free)} sisa
      </div>
      <div className="storage-sub">
        Folder storage: {formatBytes(usage.storage.size)}
      </div>
    </div>
  )
}

export default StorageUsage
