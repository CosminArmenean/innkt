import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private globalLoadingSubject = new BehaviorSubject<LoadingState>({ isLoading: false });
  private componentLoadingSubject = new BehaviorSubject<Map<string, LoadingState>>(new Map());

  public globalLoading$ = this.globalLoadingSubject.asObservable();
  public componentLoading$ = this.componentLoadingSubject.asObservable();

  // Global loading methods
  showGlobalLoading(message?: string, progress?: number): void {
    this.globalLoadingSubject.next({
      isLoading: true,
      message,
      progress
    });
  }

  hideGlobalLoading(): void {
    this.globalLoadingSubject.next({ isLoading: false });
  }

  updateGlobalProgress(progress: number): void {
    const currentState = this.globalLoadingSubject.value;
    this.globalLoadingSubject.next({
      ...currentState,
      progress
    });
  }

  // Component-specific loading methods
  showComponentLoading(componentId: string, message?: string, progress?: number): void {
    const currentMap = this.componentLoadingSubject.value;
    currentMap.set(componentId, {
      isLoading: true,
      message,
      progress
    });
    this.componentLoadingSubject.next(new Map(currentMap));
  }

  hideComponentLoading(componentId: string): void {
    const currentMap = this.componentLoadingSubject.value;
    currentMap.delete(componentId);
    this.componentLoadingSubject.next(new Map(currentMap));
  }

  updateComponentProgress(componentId: string, progress: number): void {
    const currentMap = this.componentLoadingSubject.value;
    const currentState = currentMap.get(componentId);
    if (currentState) {
      currentMap.set(componentId, {
        ...currentState,
        progress
      });
      this.componentLoadingSubject.next(new Map(currentMap));
    }
  }

  // Check loading states
  isGlobalLoading(): boolean {
    return this.globalLoadingSubject.value.isLoading;
  }

  isComponentLoading(componentId: string): boolean {
    const currentMap = this.componentLoadingSubject.value;
    return currentMap.get(componentId)?.isLoading || false;
  }

  getComponentLoadingState(componentId: string): LoadingState | undefined {
    const currentMap = this.componentLoadingSubject.value;
    return currentMap.get(componentId);
  }

  // Batch operations
  showMultipleComponentLoading(componentIds: string[], message?: string): void {
    componentIds.forEach(id => {
      this.showComponentLoading(id, message);
    });
  }

  hideMultipleComponentLoading(componentIds: string[]): void {
    componentIds.forEach(id => {
      this.hideComponentLoading(id);
    });
  }

  // Clear all loading states
  clearAllLoading(): void {
    this.hideGlobalLoading();
    this.componentLoadingSubject.next(new Map());
  }

  // Get loading count
  getActiveLoadingCount(): number {
    let count = this.isGlobalLoading() ? 1 : 0;
    const componentMap = this.componentLoadingSubject.value;
    componentMap.forEach(state => {
      if (state.isLoading) count++;
    });
    return count;
  }
}





