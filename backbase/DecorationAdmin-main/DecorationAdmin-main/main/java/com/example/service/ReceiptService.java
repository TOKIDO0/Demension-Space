package com.example.service;

import com.example.entity.Receipt;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.ReceiptMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class ReceiptService extends ServiceImpl<ReceiptMapper, Receipt> {

    @Resource
    private ReceiptMapper receiptMapper;

}
