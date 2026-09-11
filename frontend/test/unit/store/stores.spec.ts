import { useBookingAppointmentStore } from '@/store/bookingAppointmentStore';
import { useChannelStore, type Channel } from '@/store/useChannelStore';
import { useCounterStore } from '@/store/useCounterStore';
import { useFilterDoctorsStore } from '@/store/filterDoctorsStore';
import { useUserStore } from '@/store/useUserStore';

describe('patient Zustand stores', () => {
  beforeEach(() => {
    useBookingAppointmentStore.getState().reset();
    useChannelStore.setState({ channels: [], chatBoxChannels: [] });
    useCounterStore.getState().reset();
    useFilterDoctorsStore.setState({ search: '', specialtyIdSelect: 0, minExperienceSelect: 0, maxExperienceSelect: 0, workplaceInput: '', areaSelect: '' });
    useUserStore.getState().resetState();
  });

  it('updates and resets booking selections', () => {
    const store = useBookingAppointmentStore.getState();
    store.setDoctorId(8);
    store.setDoctorScheduleId(12);
    store.setTempTime({ start_time: '08:00', end_time: '09:00' });
    expect(useBookingAppointmentStore.getState()).toMatchObject({ doctor_id: 8, doctor_schedule_id: 12 });
    useBookingAppointmentStore.getState().reset();
    expect(useBookingAppointmentStore.getState()).toMatchObject({ doctor_id: 0, doctor_schedule_id: 0 });
  });

  it('supports value and functional channel updates', () => {
    const channel = { channel_id: 1 } as Channel;
    useChannelStore.getState().setChannels([channel]);
    useChannelStore.getState().setChannels((previous) => [...previous, { channel_id: 2 } as Channel]);
    useChannelStore.getState().setChatBoxChannels([channel]);
    expect(useChannelStore.getState().channels.map((item) => item.channel_id)).toEqual([1, 2]);
    expect(useChannelStore.getState().chatBoxChannels).toEqual([channel]);
  });

  it('increments, decrements and resets the notification counter', () => {
    useCounterStore.getState().increase();
    useCounterStore.getState().increase();
    useCounterStore.getState().decrease();
    expect(useCounterStore.getState().count).toBe(1);
    useCounterStore.getState().reset();
    expect(useCounterStore.getState().count).toBe(0);
  });

  it('updates doctor discovery filters independently', () => {
    const store = useFilterDoctorsStore.getState();
    store.setSearch('cardiology');
    store.setSpecialtyIdSelect(3);
    store.setMinExperienceSelect(5);
    store.setMaxExperienceSelect(20);
    store.setWorkplaceInput('Central Hospital');
    store.setAreaSelect('HCM');
    expect(useFilterDoctorsStore.getState()).toMatchObject({ search: 'cardiology', specialtyIdSelect: 3, minExperienceSelect: 5, maxExperienceSelect: 20, workplaceInput: 'Central Hospital', areaSelect: 'HCM' });
  });

  it('stores and clears the active user', () => {
    useUserStore.getState().setUserInfo({ id: 7 } as never);
    expect(useUserStore.getState().userInfo).toMatchObject({ id: 7 });
    useUserStore.getState().resetState();
    expect(useUserStore.getState().userInfo).toBeNull();
  });
});

