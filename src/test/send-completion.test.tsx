import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UploadProgress } from '@/videos/components/upload-progress';
import { setUpload } from '@/videos/lib/upload-store';

afterEach(() => { cleanup(); setUpload({ status: 'idle', progress: 0 }); });
describe('Publication progress completion', () => {
  it('disappears immediately when publication succeeds without manual dismissal', () => {
    setUpload({ status: 'finishing', progress: 100 });
    const view = render(<UploadProgress />);
    expect(view.queryByRole('status')).not.toBeNull();
    act(() => setUpload({ status: 'done', progress: 100 }));
    expect(view.queryByRole('status')).toBeNull();
  });
  it('stays visible when bytes are uploaded but publication is still pending', () => {
    setUpload({ status: 'finishing', progress: 100 });
    expect(render(<UploadProgress />).queryByRole('status')).not.toBeNull();
  });
  it('keeps publication errors visible', () => {
    setUpload({ status: 'error', progress: 0, message: 'Envoi interrompu' });
    expect(render(<UploadProgress />).queryByRole('status')).not.toBeNull();
  });
});