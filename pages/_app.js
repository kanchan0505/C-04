import '@/styles/globals.css';
import { Provider } from 'react-redux';
import store from '@/store';
import Navbar from '@/components/Navbar';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Head>
        <title>NBA Criteria 4 Automation System</title>
        <meta name="description" content="Automate NBA Criteria 4 (Tier-II Engineering) report generation — enrolment ratio, success rates, academic performance, and placement tracking." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-[1440px] mx-auto w-full">
          <Component {...pageProps} />
        </main>
      </div>
    </Provider>
  );
}
