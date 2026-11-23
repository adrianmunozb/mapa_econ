/** Keep only the latest pointer event until the next display frame. */
export function frameCoalescer<T>(
  emit: (value: T) => void,
  request: (callback: FrameRequestCallback) => number,
  cancel: (id: number) => void,
) {
  let frame: number | null = null;
  let latest: T;
  return {
    push(value: T) {
      latest = value;
      if (frame !== null) return;
      frame = request(() => { frame = null; emit(latest); });
    },
    cancel() { if (frame !== null) cancel(frame); frame = null; },
  };
}

export interface FillState { expression: unknown; colors: [unknown, unknown]; active: number; }
export function nextFill(state: FillState, expression: unknown): FillState {
  if (state.expression === expression) return state;
  const active = 1 - state.active;
  const colors: [unknown, unknown] = [...state.colors];
  colors[active] = expression;
  return { expression, colors, active };
}
