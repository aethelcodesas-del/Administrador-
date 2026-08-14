import { supabase } from '../lib/supabase';
import { Subscription, Plan } from '../types';

export const subscriptionService = {
  /**
   * Obtiene la lista completa de suscripciones de clientes.
   */
  async list(clientId?: string): Promise<Subscription[]> {
    let query = supabase
      .from('subscriptions')
      .select('*, clients(name), subscription_plans(name, price)');

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((s: any) => {
      const plan = s.subscription_plans || {};
      return {
        id: s.id,
        clientId: s.client_id,
        clientName: s.clients?.name || 'Cliente Desconocido',
        planId: s.plan_id || '',
        planName: plan.name || 'Plan Personalizado',
        price: Number(plan.price || 0),
        currency: 'USD',
        periodicity: s.expiration_date && s.start_date && (new Date(s.expiration_date).getTime() - new Date(s.start_date).getTime()) > 40 * 24 * 3600 * 1000 ? 'Anual' : 'Mensual',
        startDate: s.start_date ? s.start_date.split('T')[0] : '',
        nextBillingDate: s.expiration_date ? s.expiration_date.split('T')[0] : '',
        expirationDate: s.expiration_date ? s.expiration_date.split('T')[0] : '',
        status: s.status || 'Activa',
        paymentMethod: 'Transferencia Directa',
      };
    });
  },

  /**
   * Obtiene los planes de suscripción configurados en Supabase.
   */
  async listPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('status', 'Activo')
      .order('price', { ascending: true });

    if (error) throw error;

    return (data || []).map((p: any) => {
      // Map allowed module codes dynamically based on slug/level
      let allowedModuleCodes = ['dashboard', 'campana', 'electores', 'documentos'];
      if (p.slug === 'plus') {
        allowedModuleCodes = ['dashboard', 'campana', 'territorio', 'electores', 'lideres', 'documentos'];
      } else if (p.slug === 'pro' || p.slug === 'enterprise') {
        allowedModuleCodes = [
          'dashboard', 'campana', 'territorio', 'electores', 'lideres', 'investigacion',
          'estrategia', 'finanzas', 'comunicaciones', 'operacion', 'documentos', 'ia',
          'reportes', 'soporte', 'bitacora', 'simulador'
        ];
      }

      return {
        id: p.id,
        name: p.name,
        code: p.slug.toUpperCase(),
        description: p.description || '',
        monthlyPrice: Number(p.price || 0),
        annualPrice: Number(p.price || 0) * 10,
        maxUsers: p.slug === 'enterprise' ? -1 : (p.slug === 'pro' ? 50 : (p.slug === 'plus' ? 15 : 5)),
        maxCampaigns: p.slug === 'enterprise' ? 10 : (p.slug === 'pro' ? 5 : (p.slug === 'plus' ? 2 : 1)),
        maxStorageGB: p.slug === 'enterprise' ? 500 : (p.slug === 'pro' ? 100 : (p.slug === 'plus' ? 20 : 1)),
        allowedModuleCodes,
        supportLevel: p.slug === 'enterprise' ? 'Premium 24/7' : (p.slug === 'pro' ? 'Prioritario' : 'Estándar'),
        hasAiFeatures: p.slug === 'pro' || p.slug === 'enterprise',
        activeUsersCount: 0,
        features: p.slug === 'enterprise'
          ? ['Soporte 24/7 Dedicado', 'Asistente IA Avanzado', '500 GB de almacenamiento']
          : (p.slug === 'pro' ? ['Canales avanzados', 'Asistente IA', '100 GB de almacenamiento'] : ['Capacidad básica', 'Soporte estándar']),
      };
    });
  },

  /**
   * Crea una nueva suscripción para un cliente.
   */
  async create(sub: Omit<Subscription, 'clientName' | 'planName' | 'price'>): Promise<Subscription> {
    const subId = sub.id || `SUB-${Math.floor(10000 + Math.random() * 90000)}`;

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        id: subId,
        client_id: sub.clientId,
        user_id: null,
        plan_id: sub.planId,
        status: sub.status || 'Activa',
        start_date: sub.startDate ? new Date(sub.startDate).toISOString() : new Date().toISOString(),
        expiration_date: sub.expirationDate ? new Date(sub.expirationDate).toISOString() : new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      ...sub,
      id: subId,
      clientName: '',
      planName: '',
      price: 0,
    };
  },

  /**
   * Modifica parámetros de una suscripción activa.
   */
  async update(id: string, sub: Partial<Subscription>): Promise<void> {
    const updateData: any = {};
    if (sub.status !== undefined) updateData.status = sub.status;
    if (sub.planId !== undefined) updateData.plan_id = sub.planId;
    if (sub.startDate !== undefined) updateData.start_date = new Date(sub.startDate).toISOString();
    if (sub.expirationDate !== undefined) updateData.expiration_date = new Date(sub.expirationDate).toISOString();

    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Cancela una suscripción activa.
   */
  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'Cancelada' })
      .eq('id', id);

    if (error) throw error;
  }
};
