import * as _ from 'lodash';

export function debounce( milliseconds : number = 0, options = {} ) {
  return function ( target : any, propertyKey : string, descriptor : PropertyDescriptor ) {
    const originalMethod = descriptor.value;
    descriptor.value = _.debounce(originalMethod, milliseconds, options);
    return descriptor;
  }
}