import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <p className="error-boundary-message">Something went wrong.</p>
          <Link to="/" className="error-boundary-link">
            Go home
          </Link>
        </div>
      )
    }
    return this.props.children
  }
}
