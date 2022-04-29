import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { StopOrderCondition } from 'src/app/shared/models/enums/stoporder-conditions';
import { ModalService } from 'src/app/shared/services/modal.service';
import { addDays } from 'src/app/shared/utils/datetime';
import { StopFormControls, StopFormGroup } from '../../models/command-forms.model';
import { StopFormData } from '../../models/stop-form-data.model';
import { CommandsService } from '../../services/commands.service';

@Component({
  selector: 'ats-stop-command',
  templateUrl: './stop-command.component.html',
  styleUrls: ['./stop-command.component.less']
})
export class StopCommandComponent implements OnInit, OnDestroy {
  viewData = new BehaviorSubject<CommandParams | null>(null);
  initialParams: CommandParams | null = null;
  form!: StopFormGroup;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private modal: ModalService, private service: CommandsService) {
  }

  ngOnInit() {
    this.modal.commandParams$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(initial => {
      this.initialParams = initial;

      if (this.initialParams?.instrument && this.initialParams.user) {
        let price = this.initialParams.price;
        if (price == 1 || price == null) {
          price = 0;
        }
        const command = {
          instrument: this.initialParams?.instrument,
          user: this.initialParams.user,
          type: CommandType.Stop,
          price,
          quantity: this.initialParams.quantity ?? 1,
          triggerPrice: this.initialParams.price ?? 1,
          condition: StopOrderCondition.More,
          withLimit: false
        };
        this.viewData.next(command);
        this.setStopCommand(command);
      }
    });

    this.viewData.pipe(
      filter((d): d is CommandParams => !!d),
      takeUntil(this.destroy$)
    ).subscribe(command => {
      if (command) {
        this.form = new FormGroup({
          quantity: new FormControl(command.quantity, [
            Validators.required, Validators.min(0),
          ]),
          price: new FormControl(command.price),
          triggerPrice: new FormControl(0, [
            Validators.required, Validators.min(0),
          ]),
          stopEndUnixTime: new FormControl(command.stopEndUnixTime),
          condition: new FormControl(StopOrderCondition.More),
          withLimit: new FormControl(false)
        } as StopFormControls) as StopFormGroup;
      }
    });

    this.form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) =>
        prev?.condition == curr?.condition &&
        prev?.price == curr?.price &&
        prev?.quantity == curr?.quantity &&
        prev?.triggerPrice == curr?.triggerPrice &&
        prev?.stopEndUnixTime == curr?.stopEndUnixTime),
    ).subscribe((form: StopFormData) => this.setStopCommand(form));
  }

  setStopCommand(form: StopFormData): void {
    const command = this.viewData.getValue();
    if (command && command.user) {
      const price = Number(form.price);
      const newCommand = {
        side: 'buy',
        quantity: Number(form.quantity) ?? command?.quantity ?? 1,
        triggerPrice: Number(form.triggerPrice) ?? command?.price ?? 0,
        condition: form.condition,
        stopEndUnixTime: form.stopEndUnixTime ?? addDays(new Date(), 30),
        price: form.withLimit ? price : null,
        instrument: {
          ...command.instrument
        },
        user: command.user,
      };
      this.service.setStopCommand(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.viewData.complete();
  }

  clearLimit(value: boolean) {
    if (this.form.controls.price && value) {
      this.form.controls.price.setValue(null);
    }
  }
}