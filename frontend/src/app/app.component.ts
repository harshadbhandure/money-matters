import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  apiMessage: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchHelloMessage();
  }

  fetchHelloMessage(): void {
    this.loading = true;
    this.error = '';
    
    this.apiService.getHello().subscribe({
      next: (message) => {
        this.apiMessage = message;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to connect to backend API. Make sure the backend is running on http://localhost:3000';
        this.loading = false;
        console.error('API Error:', err);
      }
    });
  }
}
