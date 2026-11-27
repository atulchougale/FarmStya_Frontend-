import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { bookingEntryGuard } from './booking-entry.guard';
import { TokenService } from '../services/token.service';

describe('bookingEntryGuard', () => {
  let role: string | null; let token: string | null;
  beforeEach(() => {
    role='Customer';token='fixture';
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:TokenService,useValue:{getAccessToken:()=>token,getCurrentUser:()=>role?{roleName:role}:null}}]});
  });
  const run=()=>TestBed.runInInjectionContext(()=>bookingEntryGuard({} as ActivatedRouteSnapshot,{} as RouterStateSnapshot));
  it('keeps guest availability accessible',()=>{token=null;role=null;expect(run()).toBeTrue();});
  it('keeps customers on their own booking workflow',()=>expect(run()).toBeTrue());
  for(const name of ['Admin','Farm Owner','Super Admin'])it('routes '+name+' through assisted booking before customer API calls',()=>{
    role=name;expect(TestBed.inject(Router).serializeUrl(run() as UrlTree)).toBe('/admin/bookings/create');
  });
});
