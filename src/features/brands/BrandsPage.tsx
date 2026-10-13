import { useState, type FormEvent } from 'react';
import { FileUp, Plus, UploadCloud } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export default function BrandsPage() {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [savedBrands, setSavedBrands] = useState<string[]>([]);

  async function createBrand(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage('La connexion à Supabase est absente. Vérifiez les variables d’environnement de Vercel.');
      return;
    }
    if (!name.trim()) {
      setMessage('Saisissez le nom de la marque.');
      return;
    }
    if (file && !ACCEPTED_TYPES.includes(file.type)) {
      setMessage('Format non accepté. Utilisez un PDF, PNG, JPG, WEBP ou SVG.');
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      setMessage('Le fichier dépasse 15 Mo. Choisissez un fichier plus léger.');
      return;
    }

    setBusy(true);
    setMessage('');
    let uploadedPath: string | null = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData.user;
      if (!user) {
        setMessage('Connectez-vous pour enregistrer une marque.');
        return;
      }

      let { data: workspace, error: workspaceError } = await supabase
        .from('workspaces').select('id').order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (workspaceError) throw workspaceError;

      if (!workspace) {
        const { data: newWorkspace, error } = await supabase
          .from('workspaces')
          .insert({ name: 'Mon espace KIVA', slug: `kiva-${user.id.slice(0, 8)}`, created_by: user.id })
          .select('id').single();
        if (error) throw error;
        workspace = newWorkspace;
      }

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert({ name: name.trim(), workspace_id: workspace.id, created_by: user.id })
        .select('id, name').single();
      if (brandError) throw brandError;

      if (file) {
        const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-100) || 'reference';
        uploadedPath = `${workspace.id}/${brand.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('brand-assets').upload(uploadedPath, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const assetKind = file.type === 'application/pdf' ? 'guideline' : 'reference';
        const { error: assetError } = await supabase.from('brand_assets').insert({
          workspace_id: workspace.id,
          brand_id: brand.id,
          storage_path: uploadedPath,
          original_filename: file.name,
          mime_type: file.type,
          file_size_bytes: file.size,
          asset_kind: assetKind,
          uploaded_by: user.id,
        });
        if (assetError) {
          await supabase.storage.from('brand-assets').remove([uploadedPath]);
          throw assetError;
        }
      }

      setSavedBrands(current => [brand.name, ...current]);
      setName('');
      setFile(null);
      setMessage(file ? 'Marque créée et fichier enregistré avec succès.' : 'Marque créée avec succès.');
      setOpen(false);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Erreur inconnue.';
      setMessage(`Enregistrement impossible : ${detail}`);
    } finally {
      setBusy(false);
    }
  }

  return <div className="subpage">
    <div className="page-title-row">
      <div><p className="eyebrow">IDENTITÉ DE MARQUE</p><h1>Mes marques</h1><p>Chaque marque garde ses propres couleurs, règles et références.</p></div>
      <button className="button button-dark" onClick={() => { setOpen(v => !v); setMessage(''); }}><Plus size={17} /> Nouvelle marque</button>
    </div>
    {open && <section className="form-card">
      <h2>Créer votre espace de marque</h2>
      <form onSubmit={createBrand}>
        <label htmlFor="brand-name">Nom de l’entreprise ou de la marque</label>
        <input id="brand-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Maison Élégance" required />
        <label className="upload-zone">
          <UploadCloud size={25} />
          <strong>{file?.name || 'Importer votre charte graphique ou une image'}</strong>
          <span>PDF, PNG, JPG, WEBP ou SVG. 15 Mo maximum.</span>
          <input type="file" accept=".pdf,image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => setFile(e.target.files?.[0] || null)} />
        </label>
        {message && <p className="helper-text" role="status">{message}</p>}
        <button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Créer la marque'}</button>
      </form>
    </section>}
    {message && !open && <p className="helper-text" role="status">{message}</p>}
    {savedBrands.length > 0 && <section className="section-block"><div className="section-heading"><div><p className="eyebrow">ENREGISTRÉES</p><h2>Vos marques</h2></div></div><div className="template-grid">{savedBrands.map((brand, i) => <article className="form-card" key={`${brand}-${i}`}><h3>{brand}</h3><p>Marque enregistrée dans votre espace KIVA.</p></article>)}</div></section>}
    <section className="empty-state">
      <div className="empty-icon"><FileUp size={27} /></div>
      <h2>Votre identité, votre terrain de jeu.</h2>
      <p>Importez une charte graphique ou quelques publications existantes. KIVA vous aidera à formaliser votre palette, votre style et vos règles de composition.</p>
      <button className="button button-light" onClick={() => setOpen(true)}><Plus size={16} /> Créer ma première marque</button>
    </section>
  </div>;
}
