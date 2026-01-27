import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', margin: '1rem' }}>
                    <h3 style={{ color: '#d32f2f', marginBottom: '0.5rem' }}>일정 상세 보기를 에러가 발생했습니다.</h3>
                    <p style={{ marginBottom: '1rem', color: '#666' }}>
                        일시적인 문제일 수 있습니다. 다시 시도하거나, 문제가 지속되면 내용을 캡쳐하여 문의해주세요.
                    </p>
                    <details style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: '1rem', borderRadius: '4px', border: '1px solid #eee', color: '#555', fontSize: '12px', overflowX: 'auto' }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 'bold' }}>에러 상세 내용 보기</summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        다시 시도
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '1rem', marginLeft: '0.5rem', padding: '0.5rem 1rem', background: '#666', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        페이지 새로고침
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
