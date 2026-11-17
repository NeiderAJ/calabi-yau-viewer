import katex from 'katex';
import { getProjection, type ProjectionId } from '../geometry/projections';

function renderExpression(element: Element, expression: string, displayMode: boolean): void {
  katex.render(expression, element as HTMLElement, {
    throwOnError: false,
    displayMode,
    strict: false,
  });
}

export function renderStaticMathematics(root: HTMLElement): void {
  for (const element of root.querySelectorAll<HTMLElement>('[data-katex]')) {
    const expression = element.dataset.katex;
    if (expression) renderExpression(element, expression, element.classList.contains('equation'));
  }
}

export function updateProjectionNote(
  projectionId: ProjectionId,
  descriptionElement: HTMLElement,
  formulaElement: HTMLElement,
): void {
  const projection = getProjection(projectionId);
  descriptionElement.textContent = projection.description;
  renderExpression(formulaElement, projection.formula, true);
}
