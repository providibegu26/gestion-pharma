/**
 * PatientsService — Endpoints `/patients` (API backend).
 */

import type { HttpClient } from '../http'
import type {
  ApiResponse,
  CreatePatientPayload,
  Patient,
  UpdatePatientPayload,
} from '../types'

export class PatientsService {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<Patient[]> {
    return this.http.get<ApiResponse<Patient[]>>('/patients').then((r) => r.data)
  }

  getById(id: string): Promise<Patient> {
    return this.http.get<ApiResponse<Patient>>(`/patients/${id}`).then((r) => r.data)
  }

  create(payload: CreatePatientPayload): Promise<Patient> {
    return this.http.post<ApiResponse<Patient>>('/patients', payload).then((r) => r.data)
  }

  update(id: string, payload: UpdatePatientPayload): Promise<Patient> {
    return this.http.patch<ApiResponse<Patient>>(`/patients/${id}`, payload).then((r) => r.data)
  }

  remove(id: string): Promise<void> {
    return this.http.delete<ApiResponse<null>>(`/patients/${id}`).then(() => undefined)
  }
}

