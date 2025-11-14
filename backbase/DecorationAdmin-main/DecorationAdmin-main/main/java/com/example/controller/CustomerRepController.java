package com.example.controller;


import com.example.common.Result;
import com.example.entity.CustomerRep;
import com.example.entity.User;
import com.example.service.*;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;

@RestController
@RequestMapping("/api/CustomerRep")
public class CustomerRepController {
    @Resource
    private ProjectService projectService;
    @Resource
    private ReceiptService receiptService;
    @Resource
    private ConstructionfundService constructionfundService;
    @Resource
    private CustomerRepService customerRepService;

    @GetMapping("/generate")
    public Result<CustomerRep> generate(@RequestParam(required=false,defaultValue = "") String id)
    {
        long l=Long.parseLong(id);
        return Result.success(customerRepService.generate(l));
    }



}
