import {Coolness} from './Coolness'

/**
 * @extends Coolness
 * @class Bar - Instances of Bar are very special. This is `code` and _italic_.
 *
 * ## Example:
 *
 * ```js
 * const b = new Bar()
 * console.log( b.foo(new Bar()) )
 * ```
 */
export class Bar extends Coolness {
	/**
	 * @property {number} blahblah - The number of blahblahs.
	 */
	blahblah = Math.random()

	/**
	 * @method foo - Takes the other Bar and does something with it to this Bar.
	 * @param {Bar} other - The other Bar to do things to this Bar with.
	 * @return {number} - The number of things done.
	 */
	foo(other) {
		return this.blah + other.blahblah
	}
}
