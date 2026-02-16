import { Component, type ReactNode, createRef } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  private homeLinkRef = createRef<HTMLAnchorElement>()

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Focus the home link when error boundary mounts for accessibility
    if (this.state.hasError && !prevState.hasError && this.homeLinkRef.current) {
      this.homeLinkRef.current.focus()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <p className="error-boundary-message">Something went wrong.</p>
          <Link 
            to={ROUTES.HOME} 
            className="error-boundary-link"
            ref={this.homeLinkRef}
          >
            Go home
          </Link>
        </div>
      )
    }
    return this.props.children
  }
}
