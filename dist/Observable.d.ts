import { Constructor } from 'lowclass';
interface ObservableInstance {
    on(eventName: string, callback: Function, context?: any): void;
    off(eventName: string, callback?: Function): void;
    emit(eventName: string, data?: any): void;
    trigger(eventName: string, data?: any): void;
    triggerEvent(eventName: string, data?: any): void;
}
export declare function ObservableMixin<T extends Constructor>(Base: T): Constructor<ObservableInstance> & T;
export declare const Observable: (new (...a: any[]) => ObservableInstance) & (new (...a: any[]) => object) & {
    mixin: typeof ObservableMixin;
};
export interface Observable extends InstanceType<typeof Observable> {
}
export default Observable;
//# sourceMappingURL=Observable.d.ts.map