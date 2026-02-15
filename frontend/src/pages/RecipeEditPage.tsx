import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader';

function ensureInstructionShape(item: unknown): { step: number; instruction: string } {
  if (item && typeof item === 'object' && 'instruction' in item) {
    return { step: (item as { step?: number }).step ?? 0, instruction: String((item as { instruction?: string }).instruction ?? '') };
  }
  if (typeof item === 'string') return { step: 0, instruction: item };
  return { step: 0, instruction: '' };
}

function ensureIngredientShape(item: unknown): { name: string; amount: number; unit: string } {
  if (item && typeof item === 'object') {
    const o = item as { name?: string; amount?: number; unit?: string };
    return { name: String(o.name ?? ''), amount: Number(o.amount) || 1, unit: String(o.unit ?? '') };
  }
  return { name: '', amount: 1, unit: '' };
}

export function RecipeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Array<{ name: string; amount: number; unit: string }>>([]);
  const [instructions, setInstructions] = useState<Array<{ step: number; instruction: string }>>([]);
  const [healthBenefits, setHealthBenefits] = useState<string[]>([]);
  const [healthConcerns, setHealthConcerns] = useState<string[]>([]);

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: any }>(`/recipes/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title ?? '');
      setDescription(recipe.description ?? '');
      const ing = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      setIngredients(ing.length ? ing.map(ensureIngredientShape) : [{ name: '', amount: 1, unit: '' }]);
      const inst = Array.isArray(recipe.instructions) ? recipe.instructions : [];
      setInstructions(inst.length ? inst.map((x: unknown, i: number) => ({ ...ensureInstructionShape(x), step: i + 1 })) : [{ step: 1, instruction: '' }]);
      setHealthBenefits(Array.isArray(recipe.healthBenefits) ? recipe.healthBenefits : []);
      setHealthConcerns(Array.isArray(recipe.healthConcerns) ? recipe.healthConcerns : []);
    }
  }, [recipe]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description: string;
      ingredients: Array<{ name: string; amount: number; unit: string }>;
      instructions: Array<{ step: number; instruction: string }>;
      healthBenefits: string[];
      healthConcerns: string[];
    }) =>
      api.put(`/recipes/${id}`, {
        title: payload.title,
        description: payload.description,
        ingredients: payload.ingredients,
        instructions: payload.instructions,
        healthBenefits: payload.healthBenefits,
        healthConcerns: payload.healthConcerns,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe updated');
      navigate(`/recipes/${id}`);
    },
    onError: () => toast.error('Failed to update recipe'),
  });

  if (isLoading || !id) {
    return <Loader variant="page" label="Loading…" />;
  }

  if (error || !recipe) {
    return (
      <div className="card-section max-w-2xl border-error/30 bg-error-muted/50">
        <p className="text-error font-medium">Recipe not found.</p>
        <Link to="/recipes" className="mt-2 inline-block text-primary-600 hover:underline font-medium">← Back to recipes</Link>
      </div>
    );
  }

  if (recipe.isCurated) {
    return (
      <div className="card-section max-w-2xl">
        <p className="text-content-muted">Curated recipes cannot be edited.</p>
        <Link to={`/recipes/${id}`} className="mt-2 inline-block text-primary-600 hover:underline font-medium">← Back to recipe</Link>
      </div>
    );
  }

  const addIngredient = () => setIngredients((prev) => [...prev, { name: '', amount: 1, unit: '' }]);
  const removeIngredient = (i: number) => setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: 'name' | 'amount' | 'unit', value: string | number) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: field === 'amount' ? Number(value) || 1 : String(value) };
      return next;
    });
  };

  const addInstruction = () => setInstructions((prev) => [...prev, { step: prev.length + 1, instruction: '' }]);
  const removeInstruction = (i: number) =>
    setInstructions((prev) => prev.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, step: idx + 1 })));
  const updateInstruction = (i: number, value: string) => {
    setInstructions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], instruction: value };
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIngredients = ingredients.filter((i) => i.name.trim());
    const cleanInstructions = instructions.filter((i) => i.instruction.trim()).map((item, idx) => ({ step: idx + 1, instruction: item.instruction }));
    if (cleanIngredients.length === 0 || cleanInstructions.length === 0) {
      toast.error('Add at least one ingredient and one instruction.');
      return;
    }
    updateMutation.mutate({
      title: title.trim() || recipe.title,
      description: description.trim(),
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      healthBenefits,
      healthConcerns,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-12">
      <Link to={`/recipes/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 rounded-lg px-3 py-2 -ml-2 hover:bg-primary-50">
        ← Back to recipe
      </Link>
      <h1 className="page-title mt-4">Edit recipe</h1>
      <p className="page-subtitle">Update title, ingredients, instructions, and health notes.</p>

      <form onSubmit={submit} className="mt-6 space-y-6 card-section">
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-content-muted mb-1">Title</label>
          <input id="edit-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" required />
        </div>
        <div>
          <label htmlFor="edit-desc" className="block text-sm font-medium text-content-muted mb-1">Description</label>
          <textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-base" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-content-muted">Ingredients</label>
            <button type="button" onClick={addIngredient} className="text-sm text-primary-600 hover:underline">Add</button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center">
                <input
                  placeholder="Amount"
                  type="text"
                  value={ing.amount === 1 && !ing.unit ? '' : String(ing.amount)}
                  onChange={(e) => updateIngredient(i, 'amount', e.target.value || '1')}
                  className="input-base w-20 py-2 text-sm"
                />
                <input
                  placeholder="Unit"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                  className="input-base w-24 py-2 text-sm"
                />
                <input
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                  className="input-base flex-1 min-w-[120px] py-2 text-sm"
                />
                <button type="button" onClick={() => removeIngredient(i)} className="text-error text-sm hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-content-muted">Instructions</label>
            <button type="button" onClick={addInstruction} className="text-sm text-primary-600 hover:underline">Add step</button>
          </div>
          <div className="space-y-2">
            {instructions.map((inst, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 text-sm font-medium">{i + 1}</span>
                <textarea
                  value={inst.instruction}
                  onChange={(e) => updateInstruction(i, e.target.value)}
                  rows={2}
                  className="input-base flex-1 py-2 text-sm"
                  placeholder="Step"
                />
                <button type="button" onClick={() => removeInstruction(i)} className="text-error text-sm hover:underline shrink-0">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-content-muted mb-1">Health benefits (one per line)</label>
          <textarea
            value={healthBenefits.join('\n')}
            onChange={(e) => setHealthBenefits(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
            rows={2}
            className="input-base"
            placeholder="e.g. Good for digestion"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-content-muted mb-1">Health concerns (one per line)</label>
          <textarea
            value={healthConcerns.join('\n')}
            onChange={(e) => setHealthConcerns(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
            rows={2}
            className="input-base"
            placeholder="e.g. High sodium"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(`/recipes/${id}`)} className="btn-secondary min-h-[44px]">
            Cancel
          </button>
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary min-h-[44px]">
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
