import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

/** Mensagem rápida no rodapé da tela (toast). */
@Injectable({ providedIn: 'root' })
export class AvisoService {
  private toastController = inject(ToastController);

  async mostrar(mensagem: string) {
    const aviso = await this.toastController.create({
      message: mensagem,
      duration: 3500,
      position: 'bottom',
    });
    await aviso.present();
  }
}
