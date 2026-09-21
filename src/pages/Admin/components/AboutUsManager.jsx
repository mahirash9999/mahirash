import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Editor } from '@tinymce/tinymce-react';

const AboutUsManager = () => {
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Default about text if nothing is in db
    const DEFAULT_ABOUT = `
    <h2>The Origin</h2>
    <p>Every legendary creation begins with a whisper. For Mahirash Parfumerie, that whisper came from the ancient spice routes and the royal courts of perfume history.</p>
    <h2>Our Process</h2>
    <p>Crafted with extreme attention to detail and patience.</p>
  `;

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const docRef = doc(db, 'settings', 'about_page');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setContent(snap.data().content || DEFAULT_ABOUT);
                } else {
                    setContent(DEFAULT_ABOUT);
                }
            } catch (err) {
                console.error("Error fetching about content:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [DEFAULT_ABOUT]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'settings', 'about_page');
            await setDoc(docRef, {
                content: content,
                updatedAt: new Date()
            }, { merge: true });
            alert('About Us page updated successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save content');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Loading editor...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-zinc-900">About Us Page Editor</h2>
                    <p className="text-sm text-zinc-500 mt-1">Design your story just like WordPress.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-black text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors uppercase tracking-widest text-[13px] font-bold rounded-lg"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <Editor
                    apiKey="fyliq0cjbctqb3mtuka0gznhq60oqj2j9seqkjtee5evz7fo"
                    value={content}
                    onEditorChange={(newContent) => setContent(newContent)}
                    init={{
                        height: 600,
                        menubar: true,
                        plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                            'bold italic forecolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help',
                        content_style: 'body { font-family:Inter, Arial,sans-serif; font-size:14px }'
                    }}
                />
            </div>
            <p className="text-xs text-zinc-500 mt-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Changes are pushed live to the "Our Story" page immediately upon saving.
            </p>
        </div>
    );
};

export default AboutUsManager;
