import { Mixin, Constructor } from 'lowclass';
export function ObservableMixin(Base) {
    class Observable extends Constructor(Base) {
        on(eventName, callback, context) {
            let eventMap = this.__eventMap;
            if (!eventMap)
                eventMap = this.__eventMap = new Map();
            let callbacks = eventMap.get(eventName);
            if (!callbacks)
                eventMap.set(eventName, (callbacks = []));
            if (typeof callback == 'function')
                callbacks.push([callback, context]);
            else
                throw new Error('Expected a function in callback argument of Observable#on.');
        }
        off(eventName, callback) {
            const eventMap = this.__eventMap;
            if (!eventMap)
                return;
            const callbacks = eventMap.get(eventName);
            if (!callbacks)
                return;
            const index = callbacks.findIndex(tuple => tuple[0] === callback);
            if (index == -1)
                return;
            callbacks.splice(index, 1);
            if (callbacks.length === 0)
                eventMap.delete(eventName);
            if (eventMap.size === 0)
                this.__eventMap = null;
        }
        emit(eventName, data) {
            const eventMap = this.__eventMap;
            if (!eventMap)
                return;
            const callbacks = eventMap.get(eventName);
            if (!callbacks)
                return;
            let tuple;
            let callback;
            let context;
            for (let i = 0, len = callbacks.length; i < len; i += 1) {
                tuple = callbacks[i];
                callback = tuple[0];
                context = tuple[1];
                callback.call(context, data);
            }
        }
        trigger(eventName, data) {
            return this.emit(eventName, data);
        }
        triggerEvent(eventName, data) {
            return this.emit(eventName, data);
        }
        __eventMap = null;
    }
    return Observable;
}
export const Observable = Mixin(ObservableMixin);
export default Observable;
//# sourceMappingURL=Observable.js.map