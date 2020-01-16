import 'jest-localstorage-mock';
import LocalStorageInterface from '../src/components/LocalStorageInterface.js';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

describe("Basic functionality", () => {

    beforeEach(() => {
        global.LS = {localStorageInterface: new LocalStorageInterface()};
    });

    test("Empty storage has been created", () => {
        expect( 
            isEmpty(global.LS.localStorageInterface.stateNames)
            && isEmpty(global.LS.localStorageInterface.archive)
        ).toBeTruthy();
    });

    test("LocalStorage has been called once", () => {
        expect(global.localStorage.getItem).toHaveBeenLastCalledWith('LsPersistentStorageArchive');
    });

    test("LocalStorage has been written with the empty archive", () => {
        expect(global.localStorage.setItem).toHaveBeenLastCalledWith('LsPersistentStorageArchive', '{}');
    });

});

describe("Creating a save state", () => {
    let creationTime, saveState;
    beforeAll(() => {
        global.LS = {localStorageInterface: new LocalStorageInterface()};
        saveState = global.LS.localStorageInterface.createSaveState('TESTSTATE');
        saveState('TESTSTATE', { valueStored: 'TESTVALUE' }, global.localStorage);
        creationTime = Math.floor(new Date().getTime()/10);
    });
    
    test("A safe state has been created", () => {
        let expected  = creationTime;
        let testState = global.LS.localStorageInterface.archive['TESTSTATE'].created;
        let testStateDividedByTen = testState / 10;
        let actual  = Math.floor(testStateDividedByTen);
        
        console.log('Actual: ', actual);
        console.log('Expected: ', expected);
        expect(actual).toBe(expected);
        //expect(Math.floor(global.LS.localStorageInterface.archive['TESTSTATE'].created/10)).toBe( creationTime);
    });

    test("The stored archive has been updated", () => {
        expect(global.localStorage.setItem).toHaveBeenCalled();
    });
    
    test("The values where stored correctly", () => {
        const localStorageValues = JSON.parse(global.localStorage.getItem('TESTSTATE'));
        expect(localStorageValues).toStrictEqual({valueStored:'TESTVALUE'});
    });

    test("Timestamp on state has been updated", () => {
        const dateBefore = global.LS.localStorageInterface.archive.TESTSTATE.created;
        saveState('TESTSTATE', { valueStored: 'TESTVALUE' }, global.localStorage);
        expect(dateBefore).toBeLessThan(global.LS.localStorageInterface.archive.TESTSTATE.created);
    });

});

describe("Checking that old and faulty values are removed", () => {
    let saveState;
    const expiredTimestamp = (new Date().getTime() - (1000*60*60*2));

    beforeEach(() => {
        global.LS = {localStorageInterface: new LocalStorageInterface()};
        saveState = global.LS.localStorageInterface.createSaveState('TESTSTATE');
        saveState('TESTSTATE', { valueStored: 'TESTVALUE' }, global.localStorage);
        global.LS.localStorageInterface.archive['TESTSTATE'].created = expiredTimestamp;
        window.localStorage.setItem('LsPersistentStorageArchive', JSON.stringify(global.LS.localStorageInterface.archive));
    });

    test("An old value has been set", () => {
        const storedArchive = window.localStorage.getItem('LsPersistentStorageArchive');
        const parsedStoredArchive = JSON.parse(storedArchive);
        expect(parsedStoredArchive).toStrictEqual({ TESTSTATE: { created: expiredTimestamp } });
    });

    test("The old value has been removed", () => {
        global.LS.localStorageInterface.refreshArchive();
        const storedArchive = window.localStorage.getItem('LsPersistentStorageArchive');
        const parsedStoredArchive = JSON.parse(storedArchive);
        expect(parsedStoredArchive).toStrictEqual({});
    });

    test("A faulty value will be removed", () => {
        const faultyArchive = merge(global.LS.localStorageInterface.archive, {'FAULTYSTATE' : {created: 123456789}});
        window.localStorage.setItem('LsPersistentStorageArchive', JSON.stringify(faultyArchive));
        global.LS.localStorageInterface.refreshArchive();
        const storedArchive = window.localStorage.getItem('LsPersistentStorageArchive');
        const parsedStoredArchive = JSON.parse(storedArchive);
        expect(parsedStoredArchive).toStrictEqual({});
    });



});