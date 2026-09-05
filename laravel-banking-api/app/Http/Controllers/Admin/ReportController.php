<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService) {}
    public function transactions(Request $request) { return response()->json($this->reportService->transactionSummary($request)); }
    public function users() { return response()->json($this->reportService->userSummary()); }
    public function balance() { return response()->json($this->reportService->balanceSummary()); }
    public function spending(Request $request) { return response()->json($this->reportService->spendingReport($request)); }
}
