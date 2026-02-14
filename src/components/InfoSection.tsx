interface InfoSectionProps {
  title: string;
  content: string;
  theme: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'gradient';
}

const themeClasses = {
  default: {
    container: 'bg-gray-100 border-gray-300',
    title: 'text-gray-900',
    content: 'text-gray-700'
  },
  primary: {
    container: 'bg-teal-50 border-teal-200',
    title: 'text-teal-900',
    content: 'text-teal-700'
  },
  success: {
    container: 'bg-green-50 border-green-200',
    title: 'text-green-900',
    content: 'text-green-700'
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    title: 'text-amber-900',
    content: 'text-amber-700'
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    title: 'text-blue-900',
    content: 'text-blue-700'
  },
  gradient: {
    container: 'bg-gradient-to-r from-teal-500 to-blue-500 border-teal-500',
    title: 'text-white',
    content: 'text-white/90'
  }
};

export default function InfoSection({ title, content, theme }: InfoSectionProps) {
  const styles = themeClasses[theme];

  return (
    <div className={`rounded-2xl border-2 p-8 ${styles.container}`}>
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <h2 className={`text-3xl font-bold ${styles.title}`}>
          {title}
        </h2>
        <div className={`text-lg whitespace-pre-line ${styles.content}`}>
          {content}
        </div>
      </div>
    </div>
  );
}
