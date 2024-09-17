export class FirebaseError extends Error {
    constructor(public readonly code: Symbol) {
        super(code.toString());
        this.name = 'FirebaseError';
    }
}