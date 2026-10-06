import StoryBrowser from '../components/StoryBrowser.jsx';
import { loadSite } from '../lib/store.js';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <StoryBrowser {...loadSite()} />;
}
