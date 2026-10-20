import './Button.css'

function Button({ variant = 'ghost', className = '', children, ...rest }) {
  return (
    <button className={`btn btn-${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}

export default Button
